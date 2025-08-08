import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";

export default function EventCamera() {
  const navigate = useNavigate();
  const { token } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    document.title = "الكاميرا — من عيونكم";
    let stream: MediaStream | null = null;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        // ignore
      }
    };
    start();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative" dir="rtl">
      {/* Top bar: H2 on the right, X on the left */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4">
        <h2 className="text-2xl font-nastaliq text-right">التقاط</h2>
        <button
          type="button"
          className="p-2 rounded-full bg-background/70 hover:bg-background/90"
          aria-label="إغلاق"
          onClick={() => navigate(`/event/${token}`)}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Camera preview */}
      <div className="h-screen w-full overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
