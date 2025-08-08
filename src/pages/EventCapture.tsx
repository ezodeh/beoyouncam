import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Camera, Video, Pause } from "lucide-react";

const EventCapture = () => {
  const { token } = useParams();
  const eventId = token ?? "demo-event";
  const authToken = token ?? "demo-token";

  useEffect(() => {
    document.title = "التقاط — من عيونكم";
  }, []);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [left, setLeft] = useState<number | typeof Infinity>(20);
  const [message, setMessage] = useState("");

  const videoEnabled = true;

  // MediaRecorder (لفيديو 10s)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [recording, setRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);

  async function requestUploadUrl(filename: string, type: "image" | "video") {
    const ext = filename.split(".").pop() || (type === "image" ? "jpg" : "mp4");
    const res = await fetch("/api/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ eventId, type, ext }),
    });
    if (!res.ok) throw new Error("فشل تحضير الرفع");
    return res.json(); // { url, fileUrl, fields? }
  }

  async function finalizeMedia(payload: any) {
    const res = await fetch(`/api/events/${eventId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("فشل حفظ الوسائط");
    return res.json();
  }

  async function uploadFile(file: File, kind: "image" | "video") {
    setBusy(true); setProgress(0);
    try {
      const { url, fileUrl, fields } = await requestUploadUrl(file.name, kind);

      if (fields) {
        const form = new FormData();
        Object.entries(fields).forEach(([k, v]) => form.append(k, v as any));
        form.append("file", file);
        await fetch(url, { method: "POST", body: form });
      } else {
        await fetch(url, { method: "PUT", body: file });
      }

      await finalizeMedia({
        type: kind,
        originalUrl: fileUrl,
        message: message?.slice(0, 180) || null,
      });

      setLeft((n) => (n === Infinity ? n : Math.max(0, (n as number) - 1)));
      setMessage("");
      alert("تم الرفع ✅");
    } catch (e: any) {
      alert(e?.message || "تعذر الرفع");
    } finally {
      setBusy(false); setProgress(0);
    }
  }

  function handlePickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (left === 0) return alert("وصلت حدك من اللقطات");
    uploadFile(f, "image");
    e.currentTarget.value = "";
  }

  async function startRecording() {
    if (left === 0) return alert("وصلت حدك من اللقطات");
    const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = s;
    if (videoRef.current) videoRef.current.srcObject = s;
    const rec = new MediaRecorder(s, { mimeType: "video/webm;codecs=vp9,opus" });
    recorderRef.current = rec;
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `clip-${Date.now()}.webm`, { type: blob.type });
      await uploadFile(file, "video");
      stopTracks();
    };
    rec.start();
    setRecording(true);
    setCountdown(10);
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null; setRecording(false); setCountdown(null);
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  useEffect(() => {
    if (recording && countdown !== null) {
      if (countdown <= 0) { stopRecording(); return; }
      const t = setTimeout(() => setCountdown((c) => (c ?? 0) - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [recording, countdown]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8">
        <div dir="rtl" className="mx-auto max-w-md p-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-2xl">التقاط لحظاتكم</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between text-sm opacity-80">
                <div>المتاح لك: {left === Infinity ? "بلا حدود" : left}</div>
                {busy && <div className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> جاري الرفع…</div>}
              </div>

              {/* صورة */}
              <div className="grid gap-2">
                <Label>صورة</Label>
                <label className="border border-dashed border-border/60 rounded-xl p-6 grid place-items-center cursor-pointer">
                  <div className="flex items-center gap-2"><Camera className="h-5 w-5"/><span>التقط صورة</span></div>
                  <Input type="file" accept="image/*;capture=camera" onChange={handlePickPhoto} className="hidden" />
                </label>
              </div>

              {/* فيديو */}
              {videoEnabled && (
                <div className="grid gap-2">
                  <Label>فيديو (10 ثوانٍ)</Label>
                  <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video object-cover" />
                    <div className="p-3 flex items-center justify-between">
                      {!recording ? (
                        <Button onClick={startRecording} disabled={busy} className="rounded-full"><Video className="mr-2 h-4 w-4"/>ابدأ التسجيل</Button>
                      ) : (
                        <Button variant="destructive" onClick={stopRecording} className="rounded-full"><Pause className="mr-2 h-4 w-4"/>إيقاف ({countdown})</Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs opacity-70">عند الإيقاف يتم رفع المقطع تلقائيًا.</p>
                </div>
              )}

              {/* رسالة مرافقة */}
              <div className="grid gap-2">
                <Label>تهنئة قصيرة (اختياري)</Label>
                <Textarea maxLength={180} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اكتب جملة صغيرة ترافق اللقطة" />
              </div>

              {busy && <Progress value={progress} />}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventCapture;
