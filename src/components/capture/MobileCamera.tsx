import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, CameraOff, Flashlight, Grid as GridIcon, Users, Image as ImageIcon, Trash2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  eventName: string;
  token: string;
  maxShots?: number; // default 120
}

type LocalItem = {
  url: string;
  type: "image" | "video";
};

const MobileCamera: React.FC<Props> = ({
  eventName,
  token,
  maxShots = 120
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
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [supportsVideo, setSupportsVideo] = useState<boolean>(typeof MediaRecorder !== "undefined");
  const [supportsTorch, setSupportsTorch] = useState<boolean>(false);
  const [showRetry, setShowRetry] = useState<{
    file?: File;
    kind?: "image" | "video";
  } | null>(null);
  const { toast } = useToast();
  const [recent, setRecent] = useState<LocalItem[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [greeting, setGreeting] = useState("");
  const navigate = useNavigate();

  // Professional Hybrid Zoom System
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string>("");
  const [cameraType, setCameraType] = useState<'wide' | 'main' | 'telephoto'>('main');
  const [isUsingDigitalZoom, setIsUsingDigitalZoom] = useState(false);
  const [maxOpticalZoom, setMaxOpticalZoom] = useState<number>(1);
  const [showCameraType, setShowCameraType] = useState(false);

  // Instagram-style camera states
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [slideUpDistance, setSlideUpDistance] = useState(0);
  const [showZoomLevel, setShowZoomLevel] = useState(false);
  
  const maxRecordingTime = 15; // 15 seconds like Instagram

  // Zoom levels configuration
  const zoomLevels = [0.5, 1, 2, 5, 10];
  const quickZoomButtons = [0.5, 1, 2, 5];

  useEffect(() => {
    if (recent.length === 0) setLeft(maxShots);
  }, [maxShots, recent.length]);

  // استنتاج الاسم من جلسة المستخدم إن لم يكن في التخزين المحلي
  useEffect(() => {
    (async () => {
      if (initialName) return;
      const { data: { session } } = await supabase.auth.getSession();
      const n = (session?.user?.user_metadata as any)?.full_name || 
                (session?.user?.user_metadata as any)?.name || 
                session?.user?.email;
      if (n) setHint(`بعيون ${n}`);
    })();
  }, [initialName]);

  // Pinch-to-zoom variables
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const startDistRef = useRef<number | null>(null);
  const baseZoomRef = useRef<number>(1);
  const startTouchY = useRef<number>(0);
  const recordingTimer = useRef<number | null>(null);
  const progressTimer = useRef<number | null>(null);

  // Touch event handlers for Instagram-style behavior
  const pressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);

  const effects = [
    { name: "بدون", css: "none" },
    { name: "المغرب - فاس", css: "saturate(1.4) contrast(1.1) hue-rotate(10deg)" },
    { name: "الجزائر - القصبة", css: "contrast(1.15) brightness(1.02) saturate(1.2)" },
    { name: "تونس - قرطاج", css: "sepia(0.25) saturate(1.15) brightness(1.05)" },
    { name: "ليبيا - طرابلس", css: "grayscale(0.1) contrast(1.15)" },
    { name: "مصر - النيل", css: "sepia(0.2) saturate(1.2) brightness(1.04)" },
    { name: "فلسطين - القدس", css: "grayscale(0.15) contrast(1.2) brightness(1.03)" },
    { name: "الأردن - البتراء", css: "sepia(0.35) saturate(1.15) contrast(1.05)" },
    { name: "سوريا - الشام", css: "hue-rotate(-10deg) saturate(1.1) contrast(1.08)" },
    { name: "لبنان - الأرز", css: "saturate(1.25) contrast(1.05)" },
    { name: "الخليج - لؤلؤ", css: "saturate(1.05) brightness(1.06)" },
    { name: "اليمن - صنعاء", css: "sepia(0.3) hue-rotate(5deg) contrast(1.05)" },
    { name: "السودان - النوبة", css: "sepia(0.25) saturate(1.1)" }
  ];
  
  const [effectIndex, setEffectIndex] = useState<number>(0);
  const [preview, setPreview] = useState<LocalItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [camAnim, setCamAnim] = useState(false);
  const [showEffectName, setShowEffectName] = useState<string | null>(null);

  // Professional Camera Discovery and Management
  async function discoverCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      console.log('Available cameras:', videoDevices.map(d => ({ 
        id: d.deviceId, 
        label: d.label 
      })));
      
      // Set default camera (prefer back camera)
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment') ||
        (!device.label.toLowerCase().includes('front') && !device.label.toLowerCase().includes('selfie'))
      ) || videoDevices[0];
      
      if (backCamera) {
        setCurrentCameraId(backCamera.deviceId);
      }
    } catch (error) {
      console.error('Error discovering cameras:', error);
    }
  }

  // Enhanced camera detection with real hardware lens support
  function getOptimalCameraForZoom(targetZoom: number): { deviceId: string; type: 'wide' | 'main' | 'telephoto'; digitalZoom: number } {
    if (availableCameras.length <= 1) {
      // Single camera fallback - limit digital zoom to 2x max for quality
      return { 
        deviceId: currentCameraId, 
        type: 'main', 
        digitalZoom: Math.min(2, targetZoom)
      };
    }

    // Advanced camera detection based on actual device capabilities
    const cameras = availableCameras.map(camera => {
      const label = camera.label.toLowerCase();
      let type: 'wide' | 'main' | 'telephoto' = 'main';
      let opticalRange = { min: 1, max: 1 };
      
      // Detect camera types based on common labels and patterns
      if (label.includes('ultra') || label.includes('wide') || label.includes('0.5')) {
        type = 'wide';
        opticalRange = { min: 0.5, max: 1 };
      } else if (label.includes('telephoto') || label.includes('tele') || label.includes('zoom') || 
                 label.includes('2x') || label.includes('3x') || label.includes('5x')) {
        type = 'telephoto';
        // Try to extract zoom level from label
        const zoomMatch = label.match(/(\d+)x/);
        const detectedZoom = zoomMatch ? parseInt(zoomMatch[1]) : 2;
        opticalRange = { min: detectedZoom, max: detectedZoom * 2 };
      } else if (label.includes('back') || label.includes('rear') || label.includes('main')) {
        type = 'main';
        opticalRange = { min: 1, max: 2 };
      }
      
      return { ...camera, type, opticalRange };
    });

    // Find the best camera for target zoom level
    let bestCamera = cameras.find(cam => cam.type === 'main') || cameras[0];
    let digitalZoom = targetZoom;

    if (targetZoom <= 0.7) {
      // Use wide camera if available
      const wideCamera = cameras.find(cam => cam.type === 'wide');
      if (wideCamera) {
        bestCamera = wideCamera;
        digitalZoom = Math.max(1, targetZoom / 0.5);
      }
    } else if (targetZoom >= 1.8) {
      // Use telephoto camera if available
      const telephotoCamera = cameras.find(cam => cam.type === 'telephoto');
      if (telephotoCamera) {
        bestCamera = telephotoCamera;
        // Calculate digital zoom needed on top of optical zoom
        const baseOpticalZoom = telephotoCamera.opticalRange.min;
        digitalZoom = Math.max(1, Math.min(2, targetZoom / baseOpticalZoom));
      }
    }

    return { 
      deviceId: bestCamera.deviceId, 
      type: bestCamera.type as 'wide' | 'main' | 'telephoto', 
      digitalZoom 
    };
  }

  // Advanced camera switching with real hardware optimization
  async function switchToOptimalCamera(targetZoom: number) {
    const optimal = getOptimalCameraForZoom(targetZoom);
    
    if (optimal.deviceId !== currentCameraId) {
      try {
        console.log(`Switching to ${optimal.type} camera for ${targetZoom}x zoom`);
        
        // Stop current stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Advanced constraints for optimal quality
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            deviceId: { exact: optimal.deviceId },
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          }
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Apply any zoom constraints if supported by hardware
        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack && videoTrack.applyConstraints) {
          try {
            await videoTrack.applyConstraints({
              zoom: optimal.digitalZoom
            } as any);
          } catch (e) {
            // Hardware zoom not supported, will use CSS transform
            console.log('Hardware zoom not supported, using digital zoom');
          }
        }
        
        streamRef.current = newStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          await videoRef.current.play().catch(() => {});
        }

        setCurrentCameraId(optimal.deviceId);
        setCameraType(optimal.type);
        setZoom(optimal.digitalZoom);
        setIsUsingDigitalZoom(optimal.digitalZoom > 1);
        
        // Show camera type indicator
        setShowCameraType(true);
        setTimeout(() => setShowCameraType(false), 2000);
        
        return true;
      } catch (error) {
        console.error('Error switching camera:', error);
        // Fallback to digital zoom with current camera
        setZoom(Math.min(2, targetZoom)); // Limit to 2x for quality
        setIsUsingDigitalZoom(true);
        return false;
      }
    } else {
      // Same camera, adjust digital zoom (limited for quality)
      const limitedZoom = optimal.type === 'telephoto' ? 
        Math.min(3, optimal.digitalZoom) : 
        Math.min(2, optimal.digitalZoom);
      
      setZoom(limitedZoom);
      setIsUsingDigitalZoom(limitedZoom > 1);
      return true;
    }
  }

  // Enhanced zoom function with quality prioritization
  async function setHybridZoom(targetZoom: number) {
    const clampedZoom = Math.max(0.5, Math.min(10, targetZoom));
    
    // Show zoom level with quality indicator
    setShowZoomLevel(true);
    setTimeout(() => setShowZoomLevel(false), 1500);
    
    // Use advanced hybrid zoom system
    await switchToOptimalCamera(clampedZoom);
  }

  async function openStream() {
    try {
      // Discover available cameras first
      await discoverCameras();
      
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: currentCameraId ? {
          deviceId: { exact: currentCameraId },
          facingMode,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 }
        } : { facingMode }
      };
      
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
      const track = s.getVideoTracks?.()?.[0];
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
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [facingMode, currentCameraId]);

  function formatCounter() {
    const captured = Math.max(0, maxShots - left);
    return `${String(captured).padStart(2, "0")}/${String(maxShots).padStart(2, "0")}`;
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function pad2(n: number) {
    return String(n).padStart(2, "0");
  }

  async function capturePhoto() {
    if (left <= 0) {
      toast({ title: "انتهى عدد اللقطات" });
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
      const blob: Blob = await new Promise(resolve => 
        canvas.toBlob(b => resolve(b!), "image/jpeg", 0.9)
      );
      const file = new File([blob], `shot-${Date.now()}.jpg`, { type: "image/jpeg" });
      const newLeft = Math.max(0, left - 1);
      setRecent(r => [{ url: URL.createObjectURL(file), type: "image" as const }, ...r].slice(0, 20));
      setLeft(newLeft);
      toast({ title: `تم الالتقاط ${pad2(maxShots - newLeft)}/${pad2(maxShots)}` });
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
    if (!supportsVideo) return;
    if (left <= 0) {
      toast({ title: "انتهى عدد اللقطات" });
      return;
    }
    try {
      const s = streamRef.current || await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true
      });
      streamRef.current = s;
      const rec = new MediaRecorder(s, { mimeType: "video/webm;codecs=vp9,opus" });
      recorderRef.current = rec;
      chunksRef.current = [];
      
      rec.ondataavailable = e => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const file = new File([blob], `clip-${Date.now()}.webm`, { type: blob.type });
        const newLeft = Math.max(0, left - 1);
        setRecent(r => [{ url: URL.createObjectURL(file), type: "video" as const }, ...r].slice(0, 20));
        setLeft(newLeft);
        toast({ title: `تم الالتقاط ${pad2(maxShots - newLeft)}/${pad2(maxShots)}` });
        try {
          await uploadFile(file, "video");
        } catch (e) {
          setLeft(n => Math.min(maxShots, n + 1));
          setShowRetry({ file, kind: "video" });
        }
        setRecording(false);
        setRecordingDuration(0);
        setRecordingProgress(0);
      };

      rec.start();
      setRecording(true);
      setRecordingDuration(0);
      setRecordingProgress(0);
      
      // Timer for duration tracking
      recordingTimer.current = window.setInterval(() => {
        setRecordingDuration(prev => {
          const next = prev + 1;
          if (next >= maxRecordingTime) {
            stopVideoRecording();
          }
          return next;
        });
      }, 1000);

      // Progress bar animation
      progressTimer.current = window.setInterval(() => {
        setRecordingProgress(prev => {
          const next = prev + (100 / (maxRecordingTime * 10));
          return next >= 100 ? 100 : next;
        });
      }, 100);

    } catch (e) {
      setShowRetry({});
    }
  }

  function stopVideoRecording() {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
        progressTimer.current = null;
      }
    }
  }

  async function uploadFile(file: File, kind: "image" | "video") {
    const ext = file.name.split(".").pop() || (kind === "image" ? "jpg" : "webm");
    const path = `events/${token}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    try {
      const { error } = await supabase.storage
        .from("event-media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });
      if (error) throw error;
      toast({ title: "تم الرفع ✅" });
    } catch (e) {
      toast({ title: "فشل — حاول مجددًا" });
      throw e;
    }
  }

  async function applyTorch(mode: "on" | "off") {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        await (track as any).applyConstraints({
          advanced: [{ torch: mode === "on" }]
        });
      }
    } catch (_) {
      toast({ title: "الفلاش غير مدعوم على هذا الجهاز/المتصفح" });
    }
  }

  // Distance calculation for pinch-to-zoom
  function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // Enhanced touch handlers with proper event prevention
  function onVideoPointerDown(e: React.PointerEvent<HTMLVideoElement>) {
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure proper pointer capture for stable touch tracking
    const target = e.currentTarget as HTMLVideoElement;
    if (target.setPointerCapture) {
      target.setPointerCapture(e.pointerId);
    }
    
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      startDistRef.current = distance(a, b);
      baseZoomRef.current = zoom;
    }
  }

  function onVideoPointerMove(e: React.PointerEvent<HTMLVideoElement>) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    // Hybrid pinch-to-zoom for two fingers
    if (pointersRef.current.size === 2 && startDistRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const dist = distance(a, b);
      const targetZoom = Math.min(10, Math.max(0.5, baseZoomRef.current * (dist / startDistRef.current)));
      
      // Use hybrid zoom system with debouncing for smooth performance
      setHybridZoom(targetZoom);
    }
  }
  
  function onVideoPointerUp(e: React.PointerEvent<HTMLVideoElement>) {
    e.preventDefault();
    e.stopPropagation();
    
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      startDistRef.current = null;
      baseZoomRef.current = zoom;
    }
  }

  // Instagram-style shutter button behavior with proper event handling
  function onShutterDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    isLongPress.current = false;
    setIsLongPressing(true);
    startTouchY.current = e.clientY;
    
    if (!supportsVideo) {
      capturePhoto();
      return;
    }
    
    // Start long press timer (300ms like Instagram)
    pressTimer.current = window.setTimeout(() => {
      isLongPress.current = true;
      startVideoRecording();
      // Add haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 300);
  }

  function onShutterMove(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLongPressing) return;
    
    const deltaY = startTouchY.current - e.clientY;
    setSlideUpDistance(Math.max(0, deltaY));
    
    // Slide up for zoom (Instagram style) with hybrid system
    if (deltaY > 0 && isLongPress.current && recording) {
      const maxSlide = 200; // pixels
      const zoomMultiplier = Math.min(deltaY / maxSlide, 1) * 4; // Max 5x zoom
      const targetZoom = Math.min(10, Math.max(0.5, 1 + zoomMultiplier));
      setHybridZoom(targetZoom);
    }
  }
  
  function onShutterUp(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLongPressing(false);
    setSlideUpDistance(0);
    setShowZoomLevel(false);
    
    // If recording, stop it
    if (recording) {
      stopVideoRecording();
      return;
    }
    
    // Clear timer if exists
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
      
      // If not long press, take photo
      if (!isLongPress.current) {
        capturePhoto();
      }
    }
    
    isLongPress.current = false;
  }

  if (permissionDenied) {
    return (
      <div className="relative w-full h-[calc(100dvh-48px)] grid place-items-center px-4 pb-[env(safe-area-inset-bottom)]" dir="rtl">
        <div className="text-center">
          <CameraOff className="mx-auto h-10 w-10 mb-3 opacity-70" />
          <h2 className="text-xl font-semibold mb-2">صلاحية الكاميرا مرفوضة</h2>
          <p className="text-sm text-muted-foreground mb-4">يمكنك المتابعة برفع من المعرض فقط.</p>
          <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            <span>اختيار من المعرض</span>
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (left <= 0) {
                  toast({ title: "وصلت حدّك" });
                  return;
                }
                uploadFile(f, f.type.startsWith("video") ? "video" : "image")
                  .then(() => setLeft(n => Math.max(0, n - 1)));
                e.currentTarget.value = "";
              }} 
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-container" dir="rtl">
      {/* Preview - Full screen video with proper positioning */}
      <video 
        ref={videoRef} 
        className="camera-video" 
        style={{
          transform: `scale(${zoom})`,
          filter: effects[effectIndex].css || "none"
        }} 
        onPointerDown={onVideoPointerDown} 
        onPointerMove={onVideoPointerMove} 
        onPointerUp={onVideoPointerUp} 
        onPointerCancel={onVideoPointerUp} 
        playsInline 
        muted 
        autoPlay 
      />

      {/* Recording indicator */}
      {recording && (
        <div className="absolute top-6 left-6 flex items-center gap-2 z-30">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white font-mono text-sm bg-black/30 backdrop-blur-sm rounded px-2 py-1">
            {formatTime(recordingDuration)}
          </span>
        </div>
      )}

      {/* Professional Zoom Level and Camera Type Indicators */}
      {showZoomLevel && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-xl font-bold shadow-lg border border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold">{zoom.toFixed(1)}x</div>
              <div className="text-xs text-gray-300 mt-1">
                {cameraType === 'wide' && '📐 عريضة'}
                {cameraType === 'main' && '📷 أساسية'}  
                {cameraType === 'telephoto' && '🔭 مقربة'}
                {isUsingDigitalZoom && zoom > 1.5 && ' • جودة محدودة'}
                {availableCameras.length === 1 && ' • عدسة واحدة'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Type Indicator */}
      {showCameraType && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-primary/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium animate-fade-in">
            {cameraType === 'wide' && '📐 العدسة العريضة'}
            {cameraType === 'main' && '📷 العدسة الأساسية'}
            {cameraType === 'telephoto' && '🔭 العدسة المقربة'}
          </div>
        </div>
      )}

      {/* Professional Zoom Controls */}
      <div className="absolute bottom-[calc(15rem+env(safe-area-inset-bottom))] left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full p-1">
          {quickZoomButtons.map((level, idx) => (
            <button
              key={idx}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                Math.abs(zoom - level) < 0.2
                  ? 'bg-white text-black shadow-lg scale-110'
                  : 'text-white hover:bg-white/20'
              }`}
              onClick={() => setHybridZoom(level)}
            >
              {level === 0.5 ? '0.5x' : level === 1 ? '1x' : `${level}x`}
            </button>
          ))}
        </div>
      </div>

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

      {/* Effect name display */}
      {showEffectName && (
        <div className="absolute inset-0 pointer-events-none grid place-items-center z-30">
          <div className="rounded-full bg-background/90 backdrop-blur-sm border border-border px-4 py-2 text-sm animate-fade-in font-medium shadow-lg">
            {showEffectName}
          </div>
        </div>
      )}

      {/* Top info: event name */}
      <div className="absolute top-6 inset-x-0 text-center">
        <h1 className="text-2xl font-bold font-nastaliq tracking-tight text-white drop-shadow-lg">
          {eventName}
        </h1>
      </div>

      {/* Left icons column */}
      <div className="absolute left-3 top-8 flex flex-col items-center gap-4">
        <Button 
          size="icon" 
          variant="secondary" 
          className="rounded-full bg-background/20 backdrop-blur-md border-white/30" 
          onClick={() => {
            setCamAnim(true);
            setTimeout(() => setCamAnim(false), 400);
            setFacingMode(m => m === "user" ? "environment" : "user");
          }} 
          aria-label="تبديل الكاميرا"
        >
          <Camera className={`h-5 w-5 text-white transition-transform ${camAnim ? "animate-spin" : ""}`} />
        </Button>

        {supportsVideo && (
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full bg-background/20 backdrop-blur-md border-white/30" 
            aria-label="إظهار/إخفاء الشبكة" 
            onClick={() => setShowGrid(v => !v)}
          >
            <GridIcon className={`h-5 w-5 text-white ${showGrid ? 'text-primary' : ''}`} />
          </Button>
        )}

        <Button 
          size="icon" 
          variant="secondary" 
          className="rounded-full bg-background/20 backdrop-blur-md border-white/30" 
          aria-label="فلاش" 
          disabled={!supportsTorch} 
          onClick={() => {
            const next = flashMode === "off" ? "on" : flashMode === "on" ? "auto" : "off";
            setFlashMode(next);
            if (supportsTorch) applyTorch(next === "on" ? "on" : "off");
          }}
        >
          <Flashlight className={`h-5 w-5 text-white ${flashMode === 'on' ? 'text-yellow-400' : ''}`} />
        </Button>

        <Button 
          size="icon" 
          variant="secondary" 
          className="rounded-full bg-background/20 backdrop-blur-md border-white/30" 
          aria-label="فلاتر وإيفكتس" 
          onClick={() => {
            const next = (effectIndex + 1) % effects.length;
            setEffectIndex(next);
            setShowEffectName(effects[next].name);
            setTimeout(() => setShowEffectName(null), 1200);
          }}
        >
          <Sparkles className="h-5 w-5 text-white" />
        </Button>
      </div>

      {/* Counter above shutter */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(11rem+env(safe-area-inset-bottom))] z-20">
        <div className="rounded-full bg-background text-foreground text-xs px-2 py-0.5 border border-border">
          {formatCounter()}
        </div>
      </div>

      {/* Enhanced Instagram-style Shutter Button */}
      <div className="absolute inset-x-0 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] flex flex-col items-center justify-center select-none gap-3">
        <div className="relative">
          {/* Progress ring for recording */}
          {recording && (
            <svg className="absolute inset-0 w-24 h-24 -rotate-90 z-10">
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="#ef4444"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - recordingProgress / 100)}`}
                className="transition-all duration-100"
              />
            </svg>
          )}
          
          {/* Main shutter button */}
          <div className="w-24 h-24 rounded-full p-1 bg-white/20 backdrop-blur-sm">
            <button 
              className={`relative w-full h-full rounded-full shadow-lg outline-none transition-all duration-200 ${
                recording 
                  ? "bg-red-500 scale-75" 
                  : isLongPressing 
                    ? "bg-white scale-110" 
                    : "bg-white"
              }`}
              onPointerDown={onShutterDown}
              onPointerMove={onShutterMove}
              onPointerUp={onShutterUp}
              onPointerCancel={onShutterUp}
              disabled={left <= 0}
              aria-label={recording ? "إيقاف التسجيل" : "التقاط"}
            >
              {!recording && (
                <span 
                  className="pointer-events-none absolute inset-0 rounded-full border-4 border-primary transition-all duration-200"
                  style={{
                    transform: isLongPressing ? 'scale(1.2)' : 'scale(1)'
                  }}
                />
              )}
            </button>
          </div>
        </div>
        
        <div className="rounded-full bg-background/70 border border-border px-3 py-1 text-xs">
          {hint}
        </div>
      </div>

      {/* Recent thumb */}
      {recent.length > 0 && (
        <button 
          className="absolute bottom-[calc(8rem+env(safe-area-inset-bottom))] left-3 w-12 h-12 rounded-lg overflow-hidden border border-border bg-background/60" 
          onClick={() => setShowRecent(true)} 
          aria-label="المعرض"
        >
          <img src={recent[0].url} alt="آخر لقطة" className="w-full h-full object-cover" />
        </button>
      )}

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-3 flex items-center justify-between">
          <Link 
            to={`/event/${token}/invites`} 
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm bg-background/80 border border-border"
          >
            <Users className="h-4 w-4" />
            <span>QR دعوة</span>
          </Link>
          
          <label className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm bg-background/80 border border-border cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            <span>المعرض</span>
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (left <= 0) {
                  toast({ title: "انتهى عدد اللقطات" });
                  return;
                }
                uploadFile(f, f.type.startsWith("video") ? "video" : "image")
                  .then(() => setLeft(n => Math.max(0, n - 1)));
                e.currentTarget.value = "";
              }} 
            />
          </label>
        </div>
      </div>

      {/* Limit banner */}
      {left <= 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-destructive/90 text-destructive-foreground px-4 py-1 text-sm">
          انتهى عدد اللقطات
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={left <= 0}>
        <DialogContent dir="rtl">
          <p className="text-sm text-muted-foreground mb-2">
            يمكنك حذف بعض اللقطات أو تسليم الألبوم الآن.
          </p>
          <label className="text-sm mb-1">اكتب مباركة (اختياري)</label>
          <Textarea 
            value={greeting} 
            onChange={e => setGreeting(e.target.value)} 
            placeholder="اكتب تهنئة قصيرة للعروسين…" 
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="secondary" onClick={() => setShowRecent(true)}>
              حذف بعض اللقطات
            </Button>
            <Button 
              onClick={() => navigate(
                `/event/${token}/submit${window.location.search}${
                  greeting ? "&greeting=" + encodeURIComponent(greeting) : ""
                }`
              )}
            >
              تسليم الألبوم الآن
            </Button>
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
            {showRetry?.file && showRetry?.kind && (
              <Button 
                onClick={async () => {
                  try {
                    await uploadFile(showRetry.file!, showRetry.kind!);
                    setShowRetry(null);
                  } catch (_) {}
                }}
              >
                إعادة المحاولة
              </Button>
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
              <div className="col-span-3 sm:col-span-4 text-center text-sm text-muted-foreground">
                لا توجد لقطات بعد
              </div>
            )}
            {recent.map((item, idx) => (
              <div 
                key={idx} 
                className="relative group border border-border rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform" 
                onClick={() => setViewerIndex(idx)}
              >
                {item.type === "image" ? (
                  <img src={item.url} alt="لقطة" className="w-full h-24 object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-24 object-cover" />
                )}
                <button 
                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground p-1" 
                  aria-label="حذف" 
                  onClick={e => {
                    e.stopPropagation();
                    setRecent(r => r.filter((_, i) => i !== idx));
                    setLeft(n => Math.min(maxShots, n + 1));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRecent(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen viewer */}
      <Dialog open={viewerIndex !== null} onOpenChange={o => { if (!o) setViewerIndex(null); }}>
        <DialogContent dir="rtl" className="p-0 max-w-none w-[100vw] h-[100dvh]">
          {viewerIndex !== null && recent[viewerIndex] && (
            <div className="relative w-full h-full bg-black">
              <div className="absolute top-3 left-3 z-20 flex gap-2">
                <Button variant="secondary" onClick={() => setViewerIndex(null)}>
                  إغلاق
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setRecent(r => r.filter((_, i) => i !== viewerIndex));
                    setLeft(n => Math.min(maxShots, n + 1));
                    setViewerIndex(null);
                  }}
                >
                  حذف
                </Button>
                <Button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = recent[viewerIndex!].url;
                    a.download = 'media';
                    a.click();
                  }}
                >
                  تنزيل
                </Button>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                {recent[viewerIndex].type === 'image' ? (
                  <img 
                    src={recent[viewerIndex].url} 
                    alt="معاينة" 
                    className="max-w-full max-h-full object-contain" 
                  />
                ) : (
                  <video 
                    src={recent[viewerIndex].url} 
                    className="max-w-full max-h-full object-contain" 
                    controls 
                    autoPlay 
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileCamera;