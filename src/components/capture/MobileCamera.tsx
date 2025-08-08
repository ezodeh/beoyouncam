import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, CameraOff, Flashlight, Grid as GridIcon, Users, Image as ImageIcon, Trash2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";


interface Props {
  eventName: string;
  token: string;
  maxShots?: number; // default 70
}

type LocalItem = { url: string; type: "image" | "video" };

const MobileCamera: React.FC<Props> = ({ eventName, token, maxShots = 70 }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [left, setLeft] = useState<number>(maxShots);
  const [hint] = useState<string>("بعيون صباح");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashMode, setFlashMode] = useState<"auto" | "on" | "off">("auto");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number>(10);
  const [supportsVideo, setSupportsVideo] = useState<boolean>(typeof MediaRecorder !== "undefined");
  const [supportsTorch, setSupportsTorch] = useState<boolean>(false);
  const [showRetry, setShowRetry] = useState<{file?: File; kind?: "image"|"video"} | null>(null);

  const { toast } = useToast();
  const [recent, setRecent] = useState<LocalItem[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const startDistRef = useRef<number | null>(null);
  const baseZoomRef = useRef<number>(1);
  const effects = [
    { name: "بدون", css: "none" },
    { name: "أبيض وأسود", css: "grayscale(1) contrast(1.1)" },
    { name: "سيبيا", css: "sepia(0.8) contrast(1.05)" },
    { name: "زاهي", css: "saturate(1.5) contrast(1.1)" },
    { name: "دافئ", css: "sepia(0.3) saturate(1.2) brightness(1.05)" },
    { name: "بارد", css: "hue-rotate(200deg) saturate(1.1)" },
  ];
  const [effectIndex, setEffectIndex] = useState<number>(0);
  const [preview, setPreview] = useState<LocalItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [camAnim, setCamAnim] = useState(false);
  const [showEffectName, setShowEffectName] = useState<string | null>(null);

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
    const captured = Math.max(0, maxShots - left);
    return `${String(captured).padStart(2, "0")}/${String(maxShots).padStart(2, "0")}`;
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
      ctx.filter = effects[effectIndex].css || "none";
      ctx.drawImage(video, 0, 0, w, h);
      const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
      const file = new File([blob], `shot-${Date.now()}.jpg`, { type: "image/jpeg" });
      setRecent((r)=>[{ url: URL.createObjectURL(file), type: "image" as const }, ...r].slice(0,20));
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
        setRecent((r)=>[{ url: URL.createObjectURL(file), type: "video" as const }, ...r].slice(0,20));
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
    } catch (_) { toast({ title: "الفلاش غير مدعوم على هذا الجهاز/المتصفح" }); }
  }

  // Pinch-to-zoom handlers
  function distance(a: { x: number; y: number }, b: { x: number; y: number }) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function onVideoPointerDown(e: React.PointerEvent<HTMLVideoElement>) {
    (e.currentTarget as HTMLVideoElement).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      startDistRef.current = distance(a, b);
      baseZoomRef.current = zoom;
    }
  }
  function onVideoPointerMove(e: React.PointerEvent<HTMLVideoElement>) {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2 && startDistRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const dist = distance(a, b);
      const next = Math.min(6, Math.max(1, baseZoomRef.current * (dist / startDistRef.current)));
      setZoom(next);
    }
  }
  function onVideoPointerUp(e: React.PointerEvent<HTMLVideoElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      startDistRef.current = null;
      baseZoomRef.current = zoom;
    }
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
    <div className="relative w-full h-[calc(100dvh-56px)] overflow-hidden overscroll-none" dir="rtl">
      {/* Preview */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover touch-none will-change-transform"
        style={{ transform: `scale(${zoom})`, filter: effects[effectIndex].css || "none" }}
        onPointerDown={onVideoPointerDown}
        onPointerMove={onVideoPointerMove}
        onPointerUp={onVideoPointerUp}
        onPointerCancel={onVideoPointerUp}
        playsInline
        muted
        autoPlay
      />

      {/* Grid overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/30" />
            ))}
          </div>
        </div>
      )}

      {showEffectName && (
        <div className="absolute inset-0 pointer-events-none grid place-items-center">
          <div className="rounded-full bg-background/80 border border-border px-3 py-1 text-xs">{showEffectName}</div>
        </div>
      )}

      {/* Top info: hint + event name + counters */}
      <div className="absolute top-6 inset-x-0 text-center">
        <h1 className="text-2xl font-bold font-nastaliq tracking-tight">{eventName}</h1>
      </div>

      {/* Left icons column */}
      <div className="absolute left-3 top-8 flex flex-col items-center gap-4">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full"
          onClick={() => {
            setCamAnim(true);
            setTimeout(() => setCamAnim(false), 400);
            setFacingMode((m) => (m === "user" ? "environment" : "user"));
          }}
          aria-label="تبديل الكاميرا"
        >
          <Camera className={`h-5 w-5 transition-transform ${camAnim ? "animate-spin" : ""}`} />
        </Button>
        {supportsVideo && (
          <Button size="icon" variant="secondary" className="rounded-full" aria-label="إظهار/إخفاء الشبكة" onClick={() => setShowGrid((v)=>!v)}>
            <GridIcon className="h-5 w-5" />
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
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full"
          aria-label="إيفكتس"
          onClick={() => {
            const next=(effectIndex+1)%effects.length;
            setEffectIndex(next);
            setShowEffectName(effects[next].name);
            setTimeout(()=>setShowEffectName(null), 1200);
          }}
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </div>

      {/* Counter above shutter */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-36 z-20">
        <div className="rounded-full bg-background text-foreground text-xs px-2 py-0.5 border border-border">{formatCounter()}</div>
      </div>

      {/* Shutter */}
      <div className="absolute inset-x-0 bottom-10 flex flex-col items-center justify-center select-none gap-3">
        {recording ? (
          <div className="w-24 h-24 rounded-full">
            <button
              className="relative w-full h-full rounded-full shadow-lg outline-none bg-brand-gradient text-brand-foreground animate-pulse"
              onPointerDown={onShutterDown}
              onPointerUp={onShutterUp}
              disabled={left <= 0}
              aria-label="التقاط"
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full p-0 bg-brand-gradient">
            <button
              className="relative w-full h-full rounded-full shadow-lg outline-none bg-white"
              onPointerDown={onShutterDown}
              onPointerUp={onShutterUp}
              disabled={left <= 0}
              aria-label="التقاط"
            >
              <span className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 4px hsl(var(--primary)) inset" }} />
            </button>
          </div>
        )}
        <div className="rounded-full bg-background/70 border border-border px-3 py-1 text-xs">{hint}</div>
      </div>

      {/* Recent thumb */}
      {recent.length > 0 && (
        <button
          className="absolute bottom-32 left-3 w-12 h-12 rounded-lg overflow-hidden border border-border bg-background/60"
          onClick={() => setShowRecent(true)}
          aria-label="المعرض"
        >
          <img src={recent[0].url} alt="آخر لقطة" className="w-full h-full object-cover" />
        </button>
      )}

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 pb-3">
        <div className="mx-3 flex items-center justify-between">
          <Link to={`/event/${token}/invites`} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm bg-background/80 border border-border">
            <Users className="h-4 w-4" />
            <span>دعوة ضيوف</span>
          </Link>
          <label className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm bg-background/80 border border-border cursor-pointer">
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

      {/* Recent modal */}
      <Dialog open={showRecent} onOpenChange={setShowRecent}>
        <DialogContent dir="rtl" className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>لقطاتي</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {recent.length === 0 && (
              <div className="col-span-3 sm:col-span-4 text-center text-sm text-muted-foreground">لا توجد لقطات بعد</div>
            )}
            {recent.map((item, idx) => (
              <div key={idx} className="relative group border border-border rounded-lg overflow-hidden cursor-pointer" onClick={() => setViewerIndex(idx)}>
                {item.type === "image" ? (
                  <img src={item.url} alt="لقطة" className="w-full h-24 object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-24 object-cover" controls />
                )}
                <button
                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground p-1"
                  aria-label="حذف"
                  onClick={(e) => { e.stopPropagation(); setRecent((r)=> r.filter((_, i)=> i !== idx)); }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={()=>setShowRecent(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen viewer */}
      <Dialog open={viewerIndex !== null} onOpenChange={(o)=>{ if(!o) setViewerIndex(null); }}>
        <DialogContent dir="rtl" className="sm:max-w-[90vw] p-0">
          {viewerIndex !== null && recent[viewerIndex] && (
            <div className="relative w-[90vw] h-[80vh] sm:h-[85vh] bg-black">
              {recent[viewerIndex].type === 'image' ? (
                <img src={recent[viewerIndex].url} alt="معاينة" className="w-full h-full object-contain" />
              ) : (
                <video src={recent[viewerIndex].url} className="w-full h-full object-contain" controls autoPlay />
              )}
              <div className="absolute bottom-3 right-3 flex gap-2">
                <Button variant="destructive" onClick={()=>{ setRecent(r=> r.filter((_,i)=> i!==viewerIndex)); setViewerIndex(null); }}>حذف</Button>
                <Button onClick={()=>{ const a=document.createElement('a'); a.href=recent[viewerIndex!].url; a.download='media'; a.click(); }}>تنزيل</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileCamera;
