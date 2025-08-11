import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, CameraOff, Flashlight, Grid as GridIcon, Users, Image as ImageIcon, Trash2, Sparkles, ArrowLeft, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
interface Props {
  eventName: string;
  token: string;
  maxShots?: number; // default 120
  enableVideo?: boolean; // default true
}
type LocalItem = {
  url: string;
  type: "image" | "video";
};
const MobileCamera: React.FC<Props> = ({
  eventName,
  token,
  maxShots = 120,
  enableVideo = true
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [left, setLeft] = useState<number>(maxShots);
  const initialName = typeof window !== "undefined" ? localStorage.getItem(`participantName:${token}`) : null;
  const [hint, setHint] = useState<string>(`بعيون ${initialName || "مناسبتكم"}`);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashMode, setFlashMode] = useState<"auto" | "on" | "off">("auto");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number>(10);
  const [supportsVideo, setSupportsVideo] = useState<boolean>(typeof MediaRecorder !== "undefined");
  const [supportsTorch, setSupportsTorch] = useState<boolean>(false);
  const [showRetry, setShowRetry] = useState<{
    file?: File;
    kind?: "image" | "video";
  } | null>(null);
  const {
    toast
  } = useToast();
  const [recent, setRecent] = useState<LocalItem[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showHeader, setShowHeader] = useState(true); // إضافة state للهيدر
  const [zoom, setZoom] = useState<number>(1);
  useEffect(() => {
    if (recent.length === 0) setLeft(maxShots);
  }, [maxShots, recent.length]);

  // استنتاج الاسم من جلسة المستخدم إن لم يكن في التخزين المحلي
  useEffect(() => {
    (async () => {
      if (initialName) return;
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      const n = (session?.user?.user_metadata as any)?.full_name || (session?.user?.user_metadata as any)?.name || session?.user?.email;
      if (n) setHint(`بعيون ${n}`);
    })();
  }, [initialName]);
  const pointersRef = useRef<Map<number, {
    x: number;
    y: number;
  }>>(new Map());
  const startDistRef = useRef<number | null>(null);
  const baseZoomRef = useRef<number>(1);
  const effects = [{
    name: "بدون",
    css: "none"
  }, {
    name: "المغرب - فاس",
    css: "saturate(1.4) contrast(1.1) hue-rotate(10deg)"
  }, {
    name: "الجزائر - القصبة",
    css: "contrast(1.15) brightness(1.02) saturate(1.2)"
  }, {
    name: "تونس - قرطاج",
    css: "sepia(0.25) saturate(1.15) brightness(1.05)"
  }, {
    name: "ليبيا - طرابلس",
    css: "grayscale(0.1) contrast(1.15)"
  }, {
    name: "مصر - النيل",
    css: "sepia(0.2) saturate(1.2) brightness(1.04)"
  }, {
    name: "فلسطين - القدس",
    css: "grayscale(0.15) contrast(1.2) brightness(1.03)"
  }, {
    name: "الأردن - البتراء",
    css: "sepia(0.35) saturate(1.15) contrast(1.05)"
  }, {
    name: "سوريا - الشام",
    css: "hue-rotate(-10deg) saturate(1.1) contrast(1.08)"
  }, {
    name: "لبنان - الأرز",
    css: "saturate(1.25) contrast(1.05)"
  }, {
    name: "الخليج - لؤلؤ",
    css: "saturate(1.05) brightness(1.06)"
  }, {
    name: "اليمن - صنعاء",
    css: "sepia(0.3) hue-rotate(5deg) contrast(1.05)"
  }, {
    name: "السودان - النوبة",
    css: "sepia(0.25) saturate(1.1)"
  }];
  const [effectIndex, setEffectIndex] = useState<number>(0);
  const [preview, setPreview] = useState<LocalItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [camAnim, setCamAnim] = useState(false);
  const [showEffectName, setShowEffectName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const navigate = useNavigate();
  async function openStream() {
    console.log("🎥 MobileCamera: Attempting to open camera stream...");
    console.log("🎥 MobileCamera: facingMode:", facingMode);
    
    try {
      // Stop existing stream first
      if (streamRef.current) {
        console.log("🎥 MobileCamera: Stopping existing stream...");
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 1280, min: 640 }
        }
      };
      console.log("🎥 MobileCamera: Requesting camera with constraints:", constraints);
      
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("🎥 MobileCamera: Camera stream obtained successfully");
      
      streamRef.current = s;
      if (videoRef.current) {
        console.log("🎥 MobileCamera: Setting video element source...");
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch((playError) => {
          console.error("🎥 MobileCamera: Video play error:", playError);
        });
        console.log("🎥 MobileCamera: Video playing successfully");
      }
      const track = s.getVideoTracks?.()?.[0];
      const caps: any = track?.getCapabilities?.();
      setSupportsTorch(Boolean(caps?.torch));
      setPermissionDenied(false);
      console.log("🎥 MobileCamera: Camera setup complete");
    } catch (e) {
      console.error("🎥 MobileCamera: Camera access error:", e);
      
      // Try fallback without exact constraint
      try {
        console.log("🎥 MobileCamera: Trying fallback camera access...");
        const fallbackConstraints: MediaStreamConstraints = {
          audio: false,
          video: { 
            facingMode,
            width: { ideal: 720 },
            height: { ideal: 1280 }
          }
        };
        
        const s = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
        setPermissionDenied(false);
        console.log("🎥 MobileCamera: Fallback camera setup complete");
      } catch (fallbackError) {
        console.error("🎥 MobileCamera: Fallback camera access failed:", fallbackError);
        // Try basic constraints as last resort
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = basicStream;
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            await videoRef.current.play();
          }
          setPermissionDenied(false);
          console.log("🎥 MobileCamera: Basic camera setup complete");
        } catch (basicError) {
          console.error("🎥 MobileCamera: All camera access attempts failed:", basicError);
          setPermissionDenied(true);
        }
      }
    }
  }
  useEffect(() => {
    openStream();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);
  function formatCounter() {
    const captured = Math.max(0, maxShots - left);
    console.log("📊 MobileCamera: Counter - captured:", captured, "maxShots:", maxShots, "left:", left);
    return `${String(captured).padStart(2, "0")}/${String(maxShots).padStart(2, "0")}`;
  }
  function pad2(n: number) {
    return String(n).padStart(2, "0");
  }
  async function capturePhoto() {
    console.log("📸 MobileCamera: Capture photo attempt, left shots:", left);
    if (left <= 0) {
      console.log("📸 MobileCamera: No shots left");
      toast({
        title: "انتهى عدد اللقطات"
      });
      return;
    }
    try {
      const video = videoRef.current!;
      const canvas = document.createElement("canvas");
      const w = video.videoWidth || 1080;
      const h = video.videoHeight || 1920;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.filter = effects[effectIndex].css || "none";
      ctx.drawImage(video, 0, 0, w, h);
      const blob: Blob = await new Promise(resolve => canvas.toBlob(b => resolve(b!), "image/jpeg", 0.9));
      const file = new File([blob], `shot-${Date.now()}.jpg`, {
        type: "image/jpeg"
      });
      const newLeft = Math.max(0, left - 1);
      setRecent(r => [{
        url: URL.createObjectURL(file),
        type: "image" as const
      }, ...r].slice(0, 20));
      // Don't auto-open fullscreen
      setLeft(newLeft);
      toast({
        title: `تم الالتقاط ${pad2(maxShots - newLeft)}/${pad2(maxShots)}`
      });
      try {
        await uploadFile(file, "image");
      } catch (e) {
        setLeft(n => Math.min(maxShots, n + 1));
        setShowRetry({});
      }
    } catch (e) {
      setShowRetry({});
    }
  }
  async function startVideoRecording() {
    if (!supportsVideo || !enableVideo) return;
    if (left <= 0) {
      toast({
        title: "انتهى عدد اللقطات"
      });
      return;
    }
    try {
      const s = streamRef.current || (await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode
        },
        audio: true
      }));
      streamRef.current = s;
      const rec = new MediaRecorder(s, {
        mimeType: "video/webm;codecs=vp9,opus"
      });
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = e => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: "video/webm"
        });
        const file = new File([blob], `clip-${Date.now()}.webm`, {
          type: blob.type
        });
        const newLeft = Math.max(0, left - 1);
        setRecent(r => [{
          url: URL.createObjectURL(file),
          type: "video" as const
        }, ...r].slice(0, 20));
        // Don't auto-open fullscreen
        setLeft(newLeft);
        toast({
          title: `تم الالتقاط ${pad2(maxShots - newLeft)}/${pad2(maxShots)}`
        });
        try {
          await uploadFile(file, "video");
        } catch (e) {
          setLeft(n => Math.min(maxShots, n + 1));
          setShowRetry({
            file,
            kind: "video"
          });
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
    if (countdown <= 0) {
      stopVideoRecording();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [recording, countdown]);
  async function uploadFile(file: File, kind: "image" | "video") {
    const ext = file.name.split(".").pop() || (kind === "image" ? "jpg" : "webm");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `events/${token}/${filename}`;
    
    try {
      // رفع الملف إلى التخزين
      const { error: uploadError } = await supabase.storage.from("event-media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });
      if (uploadError) throw uploadError;

      // البحث عن معرف المشارك
      const participantName = localStorage.getItem(`participantName:${token}`) || "";
      const { data: participant } = await supabase
        .from("participants")
        .select("id")
        .eq("event_token", token)
        .ilike("name", participantName)
        .maybeSingle();

      // ربط الملف بالمشارك في قاعدة البيانات
      if (participant?.id) {
        await supabase.from("media_submissions").insert({
          event_token: token,
          participant_id: participant.id,
          file_path: path,
          file_name: filename,
          media_type: kind,
          metadata: {
            uploaded_from: "camera",
            original_name: file.name,
            size: file.size
          }
        });
      }

      toast({
        title: "تم الرفع ✅",
        duration: 1000, // ثانية واحدة فقط
      });
    } catch (e) {
      toast({
        title: "فشل — حاول مجددًا"
      });
      throw e;
    }
  }
  async function applyTorch(mode: "on" | "off") {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        await (track as any).applyConstraints({
          advanced: [{
            torch: mode === "on"
          }]
        });
      }
    } catch (_) {
      toast({
        title: "الفلاش غير مدعوم على هذا الجهاز/المتصفح"
      });
    }
  }

  // Pinch-to-zoom handlers
  function distance(a: {
    x: number;
    y: number;
  }, b: {
    x: number;
    y: number;
  }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function onVideoPointerDown(e: React.PointerEvent<HTMLVideoElement>) {
    (e.currentTarget as HTMLVideoElement).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      startDistRef.current = distance(a, b);
      baseZoomRef.current = zoom;
    }
  }
  function onVideoPointerMove(e: React.PointerEvent<HTMLVideoElement>) {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });
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
    console.log("🎯 MobileCamera: Shutter pressed - enableVideo:", enableVideo, "supportsVideo:", supportsVideo);
    if (!supportsVideo || !enableVideo) {
      // إذا كان الفيديو معطل، التقط صورة مباشرة
      console.log("📸 MobileCamera: Video disabled, capturing photo immediately");
      capturePhoto();
      return;
    }
    pressTimer.current = window.setTimeout(() => {
      startVideoRecording();
    }, 150);
  }
  function onShutterUp(e: React.PointerEvent) {
    console.log("🎯 MobileCamera: Shutter released - recording:", recording, "pressTimer:", !!pressTimer.current, "enableVideo:", enableVideo);
    if (recording) {
      console.log("📹 MobileCamera: Stopping video recording");
      stopVideoRecording();
    } else {
      if (pressTimer.current) {
        console.log("📸 MobileCamera: Taking photo from timer");
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
        if (supportsVideo && enableVideo) {
          capturePhoto();
        }
      }
      // إذا كان الفيديو معطل، فالصورة تم التقاطها في onShutterDown
    }
  }
  if (permissionDenied) {
    return <div className="relative w-full h-[calc(100dvh-48px)] grid place-items-center px-4 pb-[env(safe-area-inset-bottom)]" dir="rtl">
        <div className="text-center">
          <CameraOff className="mx-auto h-10 w-10 mb-3 opacity-70" />
          <h2 className="text-xl font-semibold mb-2">صلاحية الكاميرا مرفوضة</h2>
          <p className="text-sm text-muted-foreground mb-4">يمكنك المتابعة برفع من المعرض فقط.</p>
          <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            <span>اختيار من المعرض</span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (left <= 0) {
              toast({
                title: "وصلت حدّك"
              });
              return;
            }
            uploadFile(f, f.type.startsWith("video") ? "video" : "image").then(() => setLeft(n => Math.max(0, n - 1)));
            e.currentTarget.value = "";
          }} />
          </label>
        </div>
      </div>;
  }
  return <div className="relative w-full h-screen overflow-hidden overscroll-none" dir="rtl">
      {/* Navbar */}
      {showHeader && (
        <div className="absolute top-0 left-0 right-0 z-40">
          <Navbar compact={true} />
          <button
            onClick={() => setShowHeader(false)}
            className="absolute top-2 left-2 p-2 bg-background/80 hover:bg-background/90 rounded-full border border-border shadow-lg backdrop-blur-sm transition-colors"
            aria-label="إخفاء الهيدر"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header toggle button when hidden */}
      {!showHeader && (
        <button
          onClick={() => setShowHeader(true)}
          className="absolute top-4 right-4 z-40 p-2 bg-background/80 hover:bg-background/90 rounded-full border border-border shadow-lg backdrop-blur-sm transition-colors"
          aria-label="إظهار الهيدر"
        >
          <Settings className="h-4 w-4" />
        </button>
      )}

      {/* Preview */}
    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover bg-black touch-none will-change-transform" style={{
      transform: `scale(${zoom})`,
      filter: effects[effectIndex].css || "none"
    }} onPointerDown={onVideoPointerDown} onPointerMove={onVideoPointerMove} onPointerUp={onVideoPointerUp} onPointerCancel={onVideoPointerUp} playsInline muted autoPlay />

      {/* Grid overlay */}
      {showGrid && <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            {Array.from({
          length: 9
        }).map((_, i) => <div key={i} className="border border-white/30" />)}
          </div>
        </div>}

      {showEffectName && <div className="absolute inset-0 pointer-events-none grid place-items-center">
          <div className="rounded-full bg-background/80 border border-border px-3 py-1 text-xs">{showEffectName}</div>
        </div>}
        
      {/* Left icons column - adjust top position when header is shown */}
      <div className={`absolute left-3 flex flex-col items-center gap-4 z-30 ${showHeader ? 'top-20' : 'top-8'}`}>
        <Button size="icon" variant="secondary" className="rounded-full" onClick={() => {
        setCamAnim(true);
        setTimeout(() => setCamAnim(false), 400);
        const newMode = facingMode === "user" ? "environment" : "user";
        setFacingMode(newMode);
        // إعادة فتح الكاميرا بالوضع الجديد
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setTimeout(() => openStream(), 100);
      }} aria-label="تبديل الكاميرا">
          <Camera className={`h-5 w-5 transition-transform ${camAnim ? "animate-spin" : ""}`} />
        </Button>
        {supportsVideo && enableVideo && <Button size="icon" variant="secondary" className="rounded-full" aria-label="إظهار/إخفاء الشبكة" onClick={() => setShowGrid(v => !v)}>
            <GridIcon className="h-5 w-5" />
          </Button>}
        <Button size="icon" variant="secondary" className="rounded-full" aria-label="فلاش" disabled={!supportsTorch} onClick={() => {
        const next = flashMode === "off" ? "on" : flashMode === "on" ? "auto" : "off";
        setFlashMode(next);
        if (supportsTorch) applyTorch(next === "on" ? "on" : "off");
      }}>
          <Flashlight className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="secondary" className="rounded-full" aria-label="إيفكتس" onClick={() => {
        const next = (effectIndex + 1) % effects.length;
        setEffectIndex(next);
        setShowEffectName(effects[next].name);
        setTimeout(() => setShowEffectName(null), 1200);
      }}>
          <Sparkles className="h-5 w-5" />
        </Button>
      </div>

      {/* Counter above shutter */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(11rem+env(safe-area-inset-bottom))] z-20">
        <div className="rounded-full bg-background text-foreground text-xs px-2 py-0.5 border border-border">{formatCounter()}</div>
      </div>

      {/* Shutter */}
      <div className="absolute inset-x-0 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] flex flex-col items-center justify-center select-none gap-3">
        {recording ? <div className="w-24 h-24 rounded-full">
            <button className="relative w-full h-full rounded-full shadow-lg outline-none bg-brand-gradient text-brand-foreground animate-pulse" onPointerDown={onShutterDown} onPointerUp={onShutterUp} disabled={left <= 0} aria-label="التقاط" />
          </div> : <div className="w-24 h-24 rounded-full p-0 bg-brand-gradient">
            <button className="relative w-full h-full rounded-full shadow-lg outline-none bg-white" onPointerDown={onShutterDown} onPointerUp={onShutterUp} disabled={left <= 0} aria-label="التقاط">
              <span className="pointer-events-none absolute inset-0 rounded-full" style={{
            boxShadow: "0 0 0 4px hsl(var(--primary)) inset"
          }} />
            </button>
          </div>}
        <div className="rounded-full bg-background/70 border border-border px-3 py-1 text-xs">{hint}</div>
      </div>

      {/* Recent thumb - معطل العرض التلقائي */}
      {recent.length > 0 && <button className="absolute bottom-[calc(8rem+env(safe-area-inset-bottom))] left-3 w-12 h-12 rounded-lg overflow-hidden border border-border bg-background/60" onClick={() => setShowRecent(true)} aria-label="المعرض">
          <img src={recent[0].url} alt="آخر لقطة" className="w-full h-full object-cover" />
        </button>}

      {/* Bottom bar - عرض QR للدعوة بدلاً من خيارات الإيميل */}
      <div className="absolute inset-x-0 bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-30">
        <div className="mx-3 flex items-center justify-between">
          <Link 
            to={`/event/${token}/invites`} 
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm bg-background/90 border border-border shadow-lg backdrop-blur-sm hover:bg-background/95 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>QR دعوة</span>
          </Link>
          <label className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm bg-background/90 border border-border cursor-pointer shadow-lg backdrop-blur-sm hover:bg-background/95 transition-colors">
            <ImageIcon className="h-4 w-4" />
            <span>المعرض</span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (left <= 0) {
              toast({
                title: "انتهى عدد اللقطات"
              });
              return;
            }
            uploadFile(f, f.type.startsWith("video") ? "video" : "image").then(() => setLeft(n => Math.max(0, n - 1)));
            e.currentTarget.value = "";
          }} />
          </label>
        </div>
      </div>

      {/* Limit banner */}
      {left <= 0 && <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-destructive/90 text-destructive-foreground px-4 py-1 text-sm">انتهى عدد اللقطات</div>}

      {/* Limit reached dialog */}
      <Dialog open={left <= 0}>
        <DialogContent dir="rtl">
          
          <p className="text-sm text-muted-foreground mb-2">يمكنك حذف بعض اللقطات أو تسليم الألبوم الآن.</p>
          <label className="text-sm mb-1">اكتب مباركة (اختياري)</label>
          <Textarea value={greeting} onChange={e => setGreeting(e.target.value)} placeholder="اكتب تهنئة قصيرة للعروسين…" />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="secondary" onClick={() => setShowRecent(true)}>حذف بعض اللقطات</Button>
            <Button onClick={() => navigate(`/event/${token}/submit${window.location.search}${greeting ? "&greeting=" + encodeURIComponent(greeting) : ""}`)}>تسليم الألبوم الآن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retry modal */}
      <Dialog open={Boolean(showRetry)} onOpenChange={o => !o && setShowRetry(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حدث خطأ أثناء الرفع</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">حاول مجددًا.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowRetry(null)}>إلغاء</Button>
            {showRetry?.file && showRetry?.kind && <Button onClick={async () => {
            try {
              await uploadFile(showRetry.file!, showRetry.kind!);
              setShowRetry(null);
            } catch (_) {}
          }}>إعادة المحاولة</Button>}
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
            {recent.length === 0 && <div className="col-span-3 sm:col-span-4 text-center text-sm text-muted-foreground">لا توجد لقطات بعد</div>}
            {recent.map((item, idx) => <div key={idx} className="relative group border border-border rounded-lg overflow-hidden cursor-pointer" onClick={() => setViewerIndex(idx)}>
                {item.type === "image" ? <img src={item.url} alt="لقطة" className="w-full h-24 object-cover" /> : <video src={item.url} className="w-full h-24 object-cover" controls />}
                  <button className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground p-1" aria-label="حذف" onClick={e => {
              e.stopPropagation();
              setRecent(r => r.filter((_, i) => i !== idx));
              setLeft(n => Math.min(maxShots, n + 1));
            }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>)}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRecent(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen viewer */}
      <Dialog open={viewerIndex !== null} onOpenChange={o => {
      if (!o) setViewerIndex(null);
    }}>
        <DialogContent dir="rtl" className="p-0 max-w-none w-[100vw] h-[100dvh]">
          {viewerIndex !== null && recent[viewerIndex] && <div className="relative w-full h-full bg-black">
              <div className="absolute top-3 left-3 z-20 flex gap-2">
                <Button variant="secondary" onClick={() => setViewerIndex(null)}>إغلاق</Button>
                <Button variant="destructive" onClick={() => {
              setRecent(r => r.filter((_, i) => i !== viewerIndex));
              setLeft(n => Math.min(maxShots, n + 1));
              setViewerIndex(null);
            }}>حذف</Button>
                <Button onClick={() => {
              const a = document.createElement('a');
              a.href = recent[viewerIndex!].url;
              a.download = 'media';
              a.click();
            }}>تنزيل</Button>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                {recent[viewerIndex].type === 'image' ? <img src={recent[viewerIndex].url} alt="معاينة" className="max-w-full max-h-full object-contain" /> : <video src={recent[viewerIndex].url} className="max-w-full max-h-full object-contain" controls autoPlay />}
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </div>;
};
export default MobileCamera;