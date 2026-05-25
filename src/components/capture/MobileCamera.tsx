import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CameraOff, Flashlight, Grid as GridIcon, Users, Image as ImageIcon, Trash2, X, RotateCcw, Timer, Check, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

// Small helper for side-rail buttons
const RailBtn: React.FC<{ children: React.ReactNode; onClick?: () => void; label: string; active?: boolean; disabled?: boolean }> = ({ children, onClick, label, active, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`w-11 h-11 rounded-full grid place-items-center backdrop-blur-md border transition-all active:scale-90 disabled:opacity-40 ${
      active
        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
        : "bg-black/40 text-white border-white/15 hover:bg-black/60"
    }`}
  >
    {children}
  </button>
);

interface Props {
  eventName: string;
  token: string;
  maxShots?: number; // default 120
  enableVideo?: boolean; // default true
}
type LocalItem = {
  url: string;
  type: "image" | "video";
  filePath?: string; // المسار الفعلي للملف في التخزين
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
  console.log("🔢 MobileCamera: Initial state - maxShots:", maxShots, "left:", left);
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
  const [zoom, setZoom] = useState<number>(1);
  // New UI state
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [flashAnim, setFlashAnim] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number; key: number } | null>(null);
  const [timerSec, setTimerSec] = useState<0 | 3 | 10>(0);
  const [timerRunning, setTimerRunning] = useState<number | null>(null);
  const [showZoomBadge, setShowZoomBadge] = useState(false);
  const zoomBadgeTimer = useRef<number | null>(null);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  useEffect(() => {
    console.log("📊 MobileCamera: Updating left shots - maxShots:", maxShots, "recent.length:", recent.length);
    const newLeft = Math.max(0, maxShots - recent.length);
    // تجنب التحديث المؤقت بوضع تأخير بسيط
    setTimeout(() => {
      setLeft(newLeft);
    }, 100);
  }, [maxShots, recent.length]);

  // Monitor changes to maxShots prop during runtime
  useEffect(() => {
    console.log("🔄 MobileCamera: maxShots prop changed to:", maxShots);
    const newLeft = Math.max(0, maxShots - recent.length);
    setTimeout(() => {
      setLeft(newLeft);
    }, 100);
  }, [maxShots]);

  // Save and restore recent photos from localStorage
  useEffect(() => {
    const storageKey = `recentPhotos:${token}`;
    
    // Load saved photos on mount
    const savedPhotos = localStorage.getItem(storageKey);
    if (savedPhotos) {
      try {
        const parsed = JSON.parse(savedPhotos);
        console.log("📷 MobileCamera: Restored recent photos:", parsed.length);
        setRecent(parsed);
      } catch (e) {
        console.error("📷 MobileCamera: Error loading saved photos:", e);
      }
    }
  }, [token]);

  // Save recent photos to localStorage whenever they change
  useEffect(() => {
    if (recent.length > 0) {
      const storageKey = `recentPhotos:${token}`;
      localStorage.setItem(storageKey, JSON.stringify(recent));
      console.log("📷 MobileCamera: Saved recent photos to localStorage:", recent.length);
    }
  }, [recent, token]);

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
      // Capture flash animation
      setFlashAnim(true);
      setTimeout(() => setFlashAnim(false), 160);
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
      
      // حفظ الملف مؤقتاً في الحالة المحلية بدون filePath
      const tempUrl = URL.createObjectURL(file);
      setRecent(r => [{
        url: tempUrl,
        type: "image" as const
      }, ...r].slice(0, 20));
      
      // Don't auto-open fullscreen
      setLeft(newLeft);
      toast({
        title: `تم الالتقاط ${pad2(maxShots - newLeft)}/${pad2(maxShots)}`
      });
      try {
        const uploadedPath = await uploadFile(file, "image");
        
        // تحديث الحالة المحلية بالمسار الحقيقي
        if (uploadedPath) {
          setRecent(r => r.map(item => 
            item.url === tempUrl 
              ? { ...item, filePath: uploadedPath }
              : item
          ));
        }
      } catch (e) {
        setLeft(n => Math.min(maxShots, n + 1));
        // إزالة الصورة من الحالة المحلية إذا فشل الرفع
        setRecent(r => r.filter(item => item.url !== tempUrl));
        setShowRetry({});
      }
    } catch (e) {
      setShowRetry({});
    }
  }

  // Tap-to-focus visual reticle (cosmetic; native browser focus control limited)
  function handleVideoTap(e: React.MouseEvent<HTMLVideoElement>) {
    if (pointersRef.current.size > 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y, key: Date.now() });
    setTimeout(() => setFocusPoint(p => (p && p.x === x && p.y === y ? null : p)), 900);
  }

  // Run shutter with optional self-timer
  function triggerShutter() {
    if (timerSec === 0) {
      if (mode === "video" && supportsVideo && enableVideo) {
        if (recording) stopVideoRecording(); else startVideoRecording();
      } else {
        capturePhoto();
      }
      return;
    }
    if (timerRunning !== null) return;
    setTimerRunning(timerSec);
    let n = timerSec;
    const tick = () => {
      n -= 1;
      if (n <= 0) {
        setTimerRunning(null);
        if (mode === "video" && supportsVideo && enableVideo) startVideoRecording();
        else capturePhoto();
      } else {
        setTimerRunning(n);
        window.setTimeout(tick, 1000);
      }
    };
    window.setTimeout(tick, 1000);
  }

  function bumpZoomBadge() {
    setShowZoomBadge(true);
    if (zoomBadgeTimer.current) window.clearTimeout(zoomBadgeTimer.current);
    zoomBadgeTimer.current = window.setTimeout(() => setShowZoomBadge(false), 1200);
  }

  useEffect(() => {
    bumpZoomBadge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);
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
        
        // Automatically generate thumbnail from first frame
        const videoUrl = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.src = videoUrl;
        
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });
        
        video.currentTime = 0.1; // Take thumbnail from 0.1 seconds
        
        await new Promise((resolve) => {
          video.onseeked = resolve;
        });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(async (thumbnailBlob) => {
            const newLeft = Math.max(0, left - 1);
            
            // حفظ الفيديو مؤقتاً في الحالة المحلية
            setRecent(r => [{
              url: videoUrl,
              type: "video" as const
            }, ...r].slice(0, 20));
            
            setLeft(newLeft);
            toast({
              title: `تم الالتقاط ${pad2(maxShots - newLeft)}/${pad2(maxShots)}`
            });
            
            try {
              const uploadedPath = await uploadFile(file, "video", thumbnailBlob || undefined);
              
              // تحديث الحالة المحلية بالمسار الحقيقي
              if (uploadedPath) {
                setRecent(r => r.map(item => 
                  item.url === videoUrl 
                    ? { ...item, filePath: uploadedPath }
                    : item
                ));
              }
            } catch (e) {
              setLeft(n => Math.min(maxShots, n + 1));
              // إزالة الفيديو من الحالة المحلية إذا فشل الرفع
              setRecent(r => r.filter(item => item.url !== videoUrl));
              setShowRetry({
                file,
                kind: "video"
              });
            }
          }, 'image/jpeg', 0.9);
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
  async function uploadFile(file: File, kind: "image" | "video", thumbnailBlob?: Blob): Promise<string | null> {
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

      let thumbnailPath = null;
      
      // Upload thumbnail for video if provided
      if (kind === "video" && thumbnailBlob) {
        const thumbnailFilename = `thumb-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const thumbnailPathFull = `events/${token}/${thumbnailFilename}`;
        
        const { error: thumbError } = await supabase.storage.from("event-media").upload(thumbnailPathFull, thumbnailBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg"
        });
        
        if (!thumbError) {
          thumbnailPath = thumbnailPathFull;
        }
      }

      // البحث عن معرف المشارك
      let participant = null;
      
      // أولاً نحاول استخدام معرف المشارك المحفوظ في localStorage
      const savedParticipantId = localStorage.getItem(`participantId:${token}`);
      if (savedParticipantId) {
        console.log("🔍 Using saved participant ID:", savedParticipantId);
        const { data: participantById } = await supabase
          .from("participants")
          .select("id, name")
          .eq("id", savedParticipantId)
          .maybeSingle();
        participant = participantById;
        console.log("👤 Found participant by saved ID:", participant);
      }
      
      // إذا لم نجد بالمعرف المحفوظ، نحاول البحث بمعرف المستخدم
      if (!participant) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          console.log("🔍 Searching for participant by user_id:", session.user.id);
          const { data: participantByUser } = await supabase
            .from("participants")
            .select("id, name")
            .eq("event_token", token)
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          participant = participantByUser;
          console.log("👤 Found participant by user_id:", participant);
          
          // إذا وجدنا المشارك، نحفظ معرفه ونحديث الاسم في localStorage
          if (participant) {
            localStorage.setItem(`participantId:${token}`, participant.id);
            if (participant.name) {
              localStorage.setItem(`participantName:${token}`, participant.name);
            }
          }
        }
      }
      
      // إذا لم نجد بالطرق السابقة، نحاول البحث بالاسم (آخر حل)
      if (!participant) {
        const participantName = localStorage.getItem(`participantName:${token}`) || "";
        console.log("🔍 Searching for participant with name:", participantName);
        
        if (participantName) {
          // أولاً نحاول البحث بالاسم الدقيق
          const { data: participantByName } = await supabase
            .from("participants")
            .select("id, name")
            .eq("event_token", token)
            .eq("name", participantName)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          participant = participantByName;
          
          // إذا لم نجد، نحاول البحث المرن
          if (!participant) {
            const { data: participantFlex } = await supabase
              .from("participants")
              .select("id, name")
              .eq("event_token", token)
              .ilike("name", `%${participantName}%`)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            participant = participantFlex;
          }
          
          // إذا وجدنا المشارك بالاسم، نحفظ معرفه
          if (participant) {
            localStorage.setItem(`participantId:${token}`, participant.id);
          }
        }
      }
      
      console.log("👤 Final participant found:", participant);

      // ربط الملف بالمشارك في قاعدة البيانات
      if (participant?.id) {
        console.log("💾 Inserting media submission for participant:", participant.id, participant.name);
        console.log("📂 File details:", {
          event_token: token,
          participant_id: participant.id,
          file_path: path,
          file_name: filename,
          media_type: kind,
          thumbnail_path: thumbnailPath
        });
        
        const mediaSubmissionData = {
          event_token: token,
          participant_id: participant.id,
          file_path: path,
          file_name: filename,
          media_type: kind,
          thumbnail_path: thumbnailPath,
          metadata: {
            uploaded_from: "camera",
            original_name: file.name,
            size: file.size,
            has_custom_thumbnail: !!thumbnailPath,
            participant_name: participant.name // حفظ اسم المشارك في metadata للاحتياط
          }
        };
        
        console.log("🔄 About to insert media submission with data:", mediaSubmissionData);
        
        const { data: insertedData, error: insertError } = await supabase
          .from("media_submissions")
          .insert(mediaSubmissionData)
          .select();
        
        if (insertError) {
          console.error("❌ Error inserting media submission:", insertError);
          console.error("❌ Insert error details:", JSON.stringify(insertError, null, 2));
        } else {
          console.log("✅ Media submission inserted successfully:", insertedData);
        }
      } else {
        console.error("❌ No participant found for media submission");
        console.error("❌ Search results - participant:", participant);
        console.error("❌ localStorage data:", {
          participantId: localStorage.getItem(`participantId:${token}`),
          participantName: localStorage.getItem(`participantName:${token}`),
          participant: localStorage.getItem(`participant:${token}`)
        });
      }

      toast({
        title: "تم الرفع ✅",
        duration: 300, // أسرع - ثلث ثانية فقط
      });
      
      // إرجاع المسار للاستخدام في تحديث الحالة المحلية
      return path;
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
    // تجنب تعارض تبديل الكاميرا مع الزوم
    if (camAnim) return;
    
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
    // تجنب الحركة أثناء تبديل الكاميرا
    if (camAnim || !pointersRef.current.has(e.pointerId)) return;
    
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
  // Gallery upload handler (shared between empty-state & bottom bar)
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type.startsWith("video") && !enableVideo) {
      toast({ title: "الفيديو غير مفعل", description: "ميزة الفيديو غير مفعلة لهذه المناسبة", variant: "destructive" });
      return;
    }
    if (left <= 0) { toast({ title: "انتهى عدد اللقطات" }); return; }
    const fileUrl = URL.createObjectURL(f);
    const fileType: "image" | "video" = f.type.startsWith("video") ? "video" : "image";
    setRecent(r => [{ url: fileUrl, type: fileType }, ...r].slice(0, 20));
    const newLeft = Math.max(0, left - 1);
    setLeft(newLeft);
    try {
      const uploadedPath = await uploadFile(f, fileType);
      if (uploadedPath) {
        setRecent(r => r.map(item => item.url === fileUrl ? { ...item, filePath: uploadedPath } : item));
      }
      toast({ title: `تم الرفع ${pad2(maxShots - newLeft)}/${pad2(maxShots)}` });
    } catch (_) {
      setLeft(n => Math.min(maxShots, n + 1));
      setRecent(r => r.filter(item => item.url !== fileUrl));
      setShowRetry({ file: f, kind: fileType });
    }
    e.currentTarget.value = "";
  };

  const isSelfie = facingMode === "user";
  const captured = Math.max(0, maxShots - left);
  const progressPct = Math.min(100, (captured / Math.max(1, maxShots)) * 100);
  const recordPct = recording ? ((10 - countdown) / 10) * 100 : 0;

  return <div className="relative w-full h-[100dvh] overflow-hidden overscroll-none bg-black text-white select-none" dir="rtl">
      {/* === Video preview === */}
      <video
        ref={videoRef}
        onClick={handleVideoTap}
        onPointerDown={onVideoPointerDown}
        onPointerMove={onVideoPointerMove}
        onPointerUp={onVideoPointerUp}
        onPointerCancel={onVideoPointerUp}
        className="absolute inset-0 w-full h-full object-cover bg-black touch-none will-change-transform"
        style={{
          transform: `scale(${zoom})${isSelfie ? " scaleX(-1)" : ""}`,
          filter: effects[effectIndex].css || "none"
        }}
        playsInline muted autoPlay
      />

      {/* === Vignette gradients top/bottom for legibility === */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />

      {/* === Grid overlay === */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/25" />)}
          </div>
        </div>
      )}

      {/* === Capture flash === */}
      <div
        className={`absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-150 ${flashAnim ? "opacity-80" : "opacity-0"}`}
      />

      {/* === Tap-to-focus reticle === */}
      {focusPoint && (
        <div
          key={focusPoint.key}
          className="pointer-events-none absolute z-30"
          style={{ left: focusPoint.x - 36, top: focusPoint.y - 36 }}
        >
          <div className="w-[72px] h-[72px] rounded-md border-2 border-yellow-300/90 animate-[ping_0.6s_ease-out_1]" />
          <div className="w-[72px] h-[72px] -mt-[72px] rounded-md border-2 border-yellow-300" />
        </div>
      )}

      {/* === Self-timer countdown === */}
      {timerRunning !== null && (
        <div className="absolute inset-0 z-40 grid place-items-center pointer-events-none">
          <div className="text-white text-[12rem] font-bold drop-shadow-2xl tabular-nums animate-pulse">
            {timerRunning}
          </div>
        </div>
      )}

      {/* === Effect name flash === */}
      {showEffectName && (
        <div className="absolute inset-0 z-30 pointer-events-none grid place-items-center">
          <div className="rounded-full bg-black/70 text-white px-4 py-1.5 text-sm backdrop-blur-md border border-white/20">{showEffectName}</div>
        </div>
      )}

      {/* === Zoom badge === */}
      {showZoomBadge && zoom > 1.05 && (
        <div className="absolute left-1/2 -translate-x-1/2 top-20 z-30 pointer-events-none">
          <div className="rounded-full bg-black/60 text-white px-3 py-1 text-xs backdrop-blur-md border border-white/20 tabular-nums">
            {zoom.toFixed(1)}×
          </div>
        </div>
      )}

      {/* === Recording indicator === */}
      {recording && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white text-sm font-medium tabular-nums">REC {countdown}s</span>
        </div>
      )}

      {/* === Top bar === */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),0.5rem)]">
        <button
          onClick={() => navigate(`/event/${token}/welcome${window.location.search}`)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md grid place-items-center border border-white/15 active:scale-95 transition-transform"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5 text-white" />
        </button>
        <div className="text-center max-w-[55%] truncate">
          <h1 className="font-nastaliq text-lg leading-tight text-white drop-shadow-lg truncate">{eventName}</h1>
          <div className="text-[10px] text-white/70 tabular-nums">{captured}/{maxShots}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md grid place-items-center border border-white/15 relative overflow-hidden">
          <svg className="absolute inset-0" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
              strokeDasharray={`${(progressPct * 1.07).toFixed(2)} 107`}
              transform="rotate(-90 20 20)" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] tabular-nums text-white relative z-10">{captured}</span>
        </div>
      </header>

      {/* === Side rail (left) === */}
      <aside className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2.5">
        <RailBtn label="تبديل الكاميرا" onClick={async () => {
          setCamAnim(true);
          try {
            if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
            const newMode = facingMode === "user" ? "environment" : "user";
            setFacingMode(newMode);
            await new Promise(r => setTimeout(r, 300));
            await openStream();
          } catch (_) { await openStream(); }
          finally { setCamAnim(false); }
        }}>
          <RotateCcw className={`h-5 w-5 ${camAnim ? "animate-spin" : ""}`} />
        </RailBtn>
        <RailBtn
          label="فلاش"
          active={flashMode !== "off"}
          disabled={!supportsTorch}
          onClick={() => {
            const next = flashMode === "off" ? "on" : flashMode === "on" ? "auto" : "off";
            setFlashMode(next);
            if (supportsTorch) applyTorch(next === "on" ? "on" : "off");
          }}
        >
          <Flashlight className="h-5 w-5" />
        </RailBtn>
        <RailBtn label="شبكة" active={showGrid} onClick={() => setShowGrid(v => !v)}>
          <GridIcon className="h-5 w-5" />
        </RailBtn>
        <RailBtn label="مؤقت" active={timerSec !== 0} onClick={() => setTimerSec(s => (s === 0 ? 3 : s === 3 ? 10 : 0))}>
          <div className="relative">
            <Timer className="h-5 w-5" />
            {timerSec !== 0 && <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 grid place-items-center">{timerSec}</span>}
          </div>
        </RailBtn>
      </aside>

      {/* === Bottom area === */}
      <div className="absolute inset-x-0 bottom-0 z-30 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {/* Effects strip */}
        <div className="px-3 mb-3">
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {effects.map((eff, i) => (
              <button
                key={eff.name}
                onClick={() => {
                  setEffectIndex(i);
                  setShowEffectName(eff.name);
                  setTimeout(() => setShowEffectName(null), 900);
                }}
                className={`snap-start shrink-0 min-w-[64px] h-10 px-3 rounded-full text-xs font-medium border backdrop-blur-md transition-all ${i === effectIndex ? "bg-primary text-primary-foreground border-primary scale-105" : "bg-black/40 text-white border-white/15"}`}
              >
                {eff.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        {supportsVideo && enableVideo && (
          <div className="flex justify-center mb-3">
            <div className="inline-flex rounded-full bg-black/50 backdrop-blur-md border border-white/15 p-1 text-xs">
              <button
                onClick={() => setMode("photo")}
                className={`px-4 py-1.5 rounded-full transition-colors ${mode === "photo" ? "bg-white text-black" : "text-white/80"}`}
              >صورة</button>
              <button
                onClick={() => setMode("video")}
                className={`px-4 py-1.5 rounded-full transition-colors ${mode === "video" ? "bg-red-500 text-white" : "text-white/80"}`}
              >فيديو</button>
            </div>
          </div>
        )}

        {/* Shutter row */}
        <div className="grid grid-cols-3 items-center px-6">
          {/* Recent thumb */}
          <div className="flex justify-start">
            {recent.length > 0 ? (
              <button
                onClick={() => setShowRecent(true)}
                className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg active:scale-95 transition-transform"
                aria-label="معرض اللقطات"
              >
                {recent[0].type === "image"
                  ? <img src={recent[0].url} alt="آخر لقطة" className="w-full h-full object-cover" />
                  : <video src={recent[0].url} className="w-full h-full object-cover" muted />}
                {recent.length > 1 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[18px] h-[18px] grid place-items-center px-1 font-bold">
                    {recent.length}
                  </span>
                )}
              </button>
            ) : (
              <label className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/30 grid place-items-center cursor-pointer active:scale-95 transition-transform">
                <ImageIcon className="h-5 w-5 text-white/70" />
                <input type="file" accept={enableVideo ? "image/*,video/*" : "image/*"} className="hidden" onChange={handleGalleryUpload} />
              </label>
            )}
          </div>

          {/* SHUTTER */}
          <div className="flex justify-center">
            <button
              onPointerDown={(e) => { if (mode === "photo" || !enableVideo) { onShutterDown(e); } }}
              onPointerUp={(e) => { if (mode === "photo" || !enableVideo) { onShutterUp(e); } else { triggerShutter(); } }}
              disabled={left <= 0 || timerRunning !== null}
              aria-label="التقاط"
              className="relative w-[84px] h-[84px] rounded-full grid place-items-center active:scale-90 transition-transform disabled:opacity-50"
            >
              {/* Progress ring for recording */}
              {recording && (
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 84 84">
                  <circle cx="42" cy="42" r="38" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                  <circle cx="42" cy="42" r="38" fill="none" stroke="#ef4444" strokeWidth="4"
                    strokeDasharray={`${(recordPct * 2.388).toFixed(2)} 238.8`} strokeLinecap="round" />
                </svg>
              )}
              {/* Outer ring */}
              <span className={`absolute inset-0 rounded-full border-4 ${recording ? "border-red-500" : "border-white"} transition-colors`} />
              {/* Inner button */}
              <span className={`block transition-all rounded-full ${recording ? "w-7 h-7 rounded-md bg-red-500" : mode === "video" ? "w-[68px] h-[68px] bg-red-500" : "w-[68px] h-[68px] bg-white"}`} />
            </button>
          </div>

          {/* Gallery upload */}
          <div className="flex justify-end">
            <label className="w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 grid place-items-center cursor-pointer active:scale-95 transition-transform">
              <ImageIcon className="h-5 w-5 text-white" />
              <input type="file" accept={enableVideo ? "image/*,video/*" : "image/*"} className="hidden" onChange={handleGalleryUpload} />
            </label>
          </div>
        </div>

        {/* Hint */}
        <div className="flex justify-center mt-3 px-4">
          <div className="rounded-full bg-black/40 backdrop-blur-md border border-white/15 px-3 py-1 text-xs text-white/90">
            {hint}
          </div>
        </div>

        {/* QR invite link */}
        <div className="flex justify-center mt-2">
          <Link
            to={`/event/${token}/invites`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs bg-black/40 backdrop-blur-md border border-white/15 text-white/90 active:scale-95 transition-transform"
          >
            <Users className="h-3.5 w-3.5" />
            <span>QR دعوة الضيوف</span>
          </Link>
        </div>
      </div>

      {/* Limit banner */}
      {left <= 0 && <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-destructive/90 text-destructive-foreground px-4 py-1 text-sm">انتهى عدد اللقطات</div>}

      {/* Limit reached dialog */}
      <Dialog open={left <= 0}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>وصلت الحد الأقصى من اللقطات</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">يمكنك حذف بعض اللقطات أو تسليم الألبوم الآن.</p>
          <label className="text-sm mb-1">اكتب مباركة (اختياري)</label>
          <Textarea value={greeting} onChange={e => setGreeting(e.target.value)} placeholder="اكتب تهنئة جميلة للمناسبة…" />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="secondary" onClick={() => setShowRecent(true)}>حذف بعض اللقطات</Button>
            <Button onClick={() => {
              const params = new URLSearchParams(window.location.search);
              if (greeting) {
                params.set('greeting', greeting);
              }
              navigate(`/event/${token}/submit?${params.toString()}`);
            }}>تسليم الألبوم الآن</Button>
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
                  <button className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground p-1" aria-label="حذف" onClick={async (e) => {
                    e.stopPropagation();
                    
                    // تأكيد الحذف
                    const confirmed = confirm("⚠️ هل أنت متأكد من حذف هذه اللقطة نهائياً؟");
                    if (!confirmed) return;
                    
                    try {
                      // حذف من الحالة المحلية أولاً للاستجابة السريعة
                      const urlToDelete = item.url;
                      setRecent(r => r.filter(i => i.url !== urlToDelete));
                      
                      // استخدام المسار المحفوظ للحذف
                      if (item.filePath) {
                        console.log("🗑️ حذف الملف من المسار:", item.filePath);
                        
                        // البحث عن معلومات الملف في قاعدة البيانات
                        const { data: mediaData } = await supabase
                          .from("media_submissions")
                          .select("thumbnail_path")
                          .eq("file_path", item.filePath)
                          .maybeSingle();
                        
                        // حذف من التخزين
                        const filesToDelete = [item.filePath];
                        if (mediaData?.thumbnail_path) {
                          filesToDelete.push(mediaData.thumbnail_path);
                        }
                        
                        const { error: storageError } = await supabase.storage
                          .from("event-media")
                          .remove(filesToDelete);
                        
                        if (storageError) {
                          console.warn("⚠️ خطأ في حذف من التخزين:", storageError);
                        } else {
                          console.log("✅ تم حذف الملف من التخزين");
                        }
                        
                        // حذف من قاعدة البيانات
                        const { error: dbError } = await supabase
                          .from("media_submissions")
                          .delete()
                          .eq("file_path", item.filePath);
                        
                        if (dbError) {
                          console.warn("⚠️ خطأ في حذف من قاعدة البيانات:", dbError);
                        } else {
                          console.log("✅ تم حذف السجل من قاعدة البيانات");
                        }
                      } else {
                        console.warn("⚠️ لا يوجد مسار محفوظ للملف - قد يكون الرفع لم يكتمل بعد");
                      }
                      
                      // تحديث العداد
                      setLeft(n => Math.min(maxShots, n + 1));
                      
                      toast({ title: "تم حذف اللقطة من كل الأماكن" });
                      
                    } catch (error) {
                      console.error("❌ خطأ في حذف اللقطة:", error);
                      // إرجاع اللقطة للقائمة في حالة الخطأ
                      setRecent(r => [item, ...r]);
                      toast({ title: "خطأ في الحذف", variant: "destructive" });
                    }
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
                <Button variant="destructive" onClick={async () => {
              if (viewerIndex === null) return;
              
              const itemToDelete = recent[viewerIndex];
              
              // تأكيد الحذف
              const confirmed = confirm("⚠️ هل أنت متأكد من حذف هذه اللقطة نهائياً؟");
              if (!confirmed) return;
              
              try {
                // حذف من الحالة المحلية أولاً
                setRecent(r => r.filter((_, i) => i !== viewerIndex));
                setLeft(n => Math.min(maxShots, n + 1));
                setViewerIndex(null);
                
                // حذف من التخزين وقاعدة البيانات
                if (itemToDelete.filePath) {
                  console.log("🗑️ حذف الملف من المسار:", itemToDelete.filePath);
                  
                  // حذف من التخزين
                  const { error: storageError } = await supabase.storage
                    .from("event-media")
                    .remove([itemToDelete.filePath]);
                  
                  if (storageError) {
                    console.warn("⚠️ خطأ في حذف من التخزين:", storageError);
                  }
                  
                  // حذف من قاعدة البيانات
                  const { error: dbError } = await supabase
                    .from("media_submissions")
                    .delete()
                    .eq("file_path", itemToDelete.filePath);
                  
                  if (dbError) {
                    console.warn("⚠️ خطأ في حذف من قاعدة البيانات:", dbError);
                  }
                  
                  toast({ title: "تم حذف اللقطة من كل الأماكن" });
                } else {
                  toast({ title: "تم حذف اللقطة محلياً" });
                }
              } catch (error) {
                console.error("❌ خطأ في حذف اللقطة:", error);
                toast({ title: "خطأ في الحذف", variant: "destructive" });
              }
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