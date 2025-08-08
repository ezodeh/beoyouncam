import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, CameraOff, Flashlight, Sparkles, Users, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";

interface Props {
  eventName: string;
  token: string;
  maxShots?: number; // default 70
}

const MobileCamera: React.FC<Props> = ({ eventName, token, maxShots = 70 }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [left, setLeft] = useState<number>(maxShots);
  const [hint] = useState<string>("جهّزوا في صباح");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashMode, setFlashMode] = useState<"auto" | "on" | "off">("auto");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number>(10);
  const [supportsVideo, setSupportsVideo] = useState<boolean>(typeof MediaRecorder !== "undefined");
  const [supportsTorch, setSupportsTorch] = useState<boolean>(false);
  const [showRetry, setShowRetry] = useState<{file?: File; kind?: "image"|"video"} | null>(null);

  const { toast } = useToast();

  async function openStream() {
    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode,
        },
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
      const track = s.getVideoTracks?.()[0];
      const caps: any = track?.getCapabilities?.();
      setSupportsTorch(Boolean(caps?.torch));
      setPermissionDenied(false);
    } catch (e) {
      setPermissionDenied(true);
    }
  }

  useEffect(() => {
    openStream();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  function formatCounter() {
    return `${String(Math.max(0, left)).padStart(2, "0")}/${String(maxShots).padStart(2, "0")}`;
  }

  async function capturePhoto() {
    if (left <= 0) {
      toast({ title: "وصلت حدّك من اللقطات" });
      return;
    }
    try {
      const video = videoRef.current!;
      const canvas = document.createElement("canvas");
      const w = video.videoWidth || 1080;
      const h = video.videoHeight || 1920;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, w, h);
      const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
      const file = new File([blob], `shot-${Date.now()}.jpg`, { type: "image/jpeg" });
      await uploadFile(file, "image");
      setLeft((n) => Math.max(0, n - 1));
    } catch (e) {
      setShowRetry({});
    }
  }

  async function startVideoRecording() {
    if (!supportsVideo) return;
    if (left <= 0) { toast({ title: "وصلت حدّك من اللقطات" }); return; }
    try {
      const s = streamRef.current || await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
      streamRef.current = s;
      const rec = new MediaRecorder(s, { mimeType: "video/webm;codecs=vp9,opus" });
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const file = new File([blob], `clip-${Date.now()}.webm`, { type: blob.type });
        try {
          await uploadFile(file, "video");
          setLeft((n) => Math.max(0, n - 1));
        } catch (e) {
          setShowRetry({ file, kind: "video" });
        }
        setRecording(false);
      };
      rec.start();
      setRecording(true);
      setCountdown(10);
    } catch (e) {
      setShowRetry({});
    }
  }

  function stopVideoRecording() {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
    }
  }

  useEffect(() => {
    if (!recording) return;
    if (countdown <= 0) { stopVideoRecording(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [recording, countdown]);

  async function uploadFile(file: File, kind: "image" | "video") {
    const authToken = token;
    const eventId = token;
    toast({ title: "جاري الرفع…" });
    try {
      const res1 = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ eventId, type: kind, ext: file.name.split(".").pop() })
      });
      if (!res1.ok) throw new Error("فشل التحضير");
      const { url, fileUrl, fields } = await res1.json();
      if (fields) {
        const form = new FormData();
        Object.entries(fields).forEach(([k, v]) => form.append(k, v as any));
        form.append("file", file);
        await fetch(url, { method: "POST", body: form });
      } else {
        await fetch(url, { method: "PUT", body: file });
      }
      const res2 = await fetch(`/api/events/${eventId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ type: kind, originalUrl: fileUrl, message: null })
      });
      if (!res2.ok) throw new Error("فشل الحفظ");
      toast({ title: "تم الرفع ✅" });
    } catch (e) {
      toast({ title: "فشل — حاول مجددًا" });
      throw e;
    }
  }

  async function applyTorch(mode: "on" | "off") {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      // @ts-ignore
      await track?.applyConstraints?.({ advanced: [{ torch: mode === "on" }] });
    } catch (_) {}
  }

  // Long-press logic
  const pressTimer = useRef<number | null>(null);
  function onShutterDown(e: React.PointerEvent) {
    if (!supportsVideo) return; // simple: only video when supported
    pressTimer.current = window.setTimeout(() => {
      startVideoRecording();
    }, 150);
  }
  function onShutterUp(e: React.PointerEvent) {
    if (recording) {
      stopVideoRecording();
    } else {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
        capturePhoto();
      }
    }
  }

  if (permissionDenied) {
    return (
      <div className="relative w-full h-[calc(100dvh-56px)] grid place-items-center px-4" dir="rtl">
        <div className="text-center">
          <CameraOff className="mx-auto h-10 w-10 mb-3 opacity-70" />
          <h2 className="text-xl font-semibold mb-2">صلاحية الكاميرا مرفوضة</h2>
          <p className="text-sm text-muted-foreground mb-4">يمكنك المتابعة برفع من المعرض فقط.</p>
          <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            <span>اختيار من المعرض</span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return; if (left <= 0) { toast({ title: "وصلت حدّك" }); return; }
              uploadFile(f, f.type.startsWith("video") ? "video" : "image").then(() => setLeft((n)=>Math.max(0,n-1)));
              e.currentTarget.value = "";
            }} />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100dvh-56px)]" dir="rtl">
      {/* Preview */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />

      {/* Hint capsule */}
      <div className="absolute top-4 inset-x-0 flex justify-center">
        <div className="rounded-full bg-background/70 border border-border px-3 py-1 text-xs">{hint}</div>
      </div>

      {/* Left icons column */}
      <div className="absolute left-3 top-20 flex flex-col items-center gap-4">
        <Button size="icon" variant="secondary" className="rounded-full" onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))} aria-label="تبديل الكاميرا">
          <Camera className="h-5 w-5" />
        </Button>
        {supportsVideo && (
          <Button size="icon" variant="secondary" className="rounded-full" aria-label="تفعيل/تعطيل فيديو 10s">
            <Sparkles className="h-5 w-5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full"
          aria-label="فلاش"
          disabled={!supportsTorch}
          onClick={() => {
            const next = flashMode === "off" ? "on" : flashMode === "on" ? "auto" : "off";
            setFlashMode(next);
            if (supportsTorch) applyTorch(next === "on" ? "on" : "off");
          }}
        >
          <Flashlight className="h-5 w-5" />
        </Button>
      </div>

      {/* Counter above shutter */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-28">
        <div className="rounded-full bg-background text-foreground text-xs px-2 py-0.5 border border-border">{formatCounter()}</div>
      </div>

      {/* Shutter */}
      <div className="absolute inset-x-0 bottom-12 flex justify-center select-none">
        <button
          className="relative h-20 w-20 rounded-full bg-white shadow-lg outline-none"
          onPointerDown={onShutterDown}
          onPointerUp={onShutterUp}
          disabled={left <= 0}
          aria-label="التقاط"
        >
          <span className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 4px hsl(var(--primary)) inset" }} />
          {recording && (
            <span className="pointer-events-none absolute -inset-2 rounded-full border-4 border-primary/60 animate-pulse" />
          )}
        </button>
      </div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 pb-2">
        <div className="mx-2 mb-2 flex items-center justify-between">
          <Link to={`/event/${token}/invites`} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm bg-background/70 border border-border">
            <Users className="h-4 w-4" />
            <span>دعوة ضيوف</span>
          </Link>
          <div className="min-w-0 mx-2 flex-1 text-center">
            <div className="whitespace-nowrap overflow-hidden">
              <div className="inline-block animate-[marquee_12s_linear_infinite]">{eventName}</div>
            </div>
          </div>
          <label className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm bg-background/70 border border-border cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            <span>المعرض</span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return; if (left <= 0) { toast({ title: "وصلت حدّك" }); return; }
              uploadFile(f, f.type.startsWith("video") ? "video" : "image").then(() => setLeft((n)=>Math.max(0,n-1)));
              e.currentTarget.value = "";
            }} />
          </label>
        </div>
      </div>

      {/* Limit banner */}
      {left <= 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-destructive/90 text-destructive-foreground px-4 py-1 text-sm">وصلت حدّك من اللقطات</div>
      )}

      {/* Retry modal */}
      <Dialog open={Boolean(showRetry)} onOpenChange={(o)=>!o && setShowRetry(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حدث خطأ أثناء الرفع</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">حاول مجددًا.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={()=>setShowRetry(null)}>إلغاء</Button>
            {showRetry?.file && showRetry?.kind && (
              <Button onClick={async ()=>{ try{ await uploadFile(showRetry.file!, showRetry.kind!); setShowRetry(null);} catch(_){} }}>إعادة المحاولة</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileCamera;
