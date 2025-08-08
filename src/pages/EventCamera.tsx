import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import MobileCamera from "@/components/capture/MobileCamera";

export default function EventCamera() {
  const navigate = useNavigate();
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "مناسبتكم";

  useEffect(() => {
    document.title = `الكاميرا — ${eventName} — من عيونكم`;
  }, [eventName]);

  return (
    <div className="min-h-screen bg-background text-foreground relative" dir="rtl">
      {/* زر إغلاق/رجوع */}
      <button
        type="button"
        className="absolute top-4 left-4 z-50 p-2 rounded-full bg-background/70 border border-border hover:bg-background"
        aria-label="إغلاق"
        onClick={() => navigate(`/event/${token}`)}
      >
        <X className="h-6 w-6" />
      </button>

      {/* واجهة الكاميرا الكاملة */}
      <MobileCamera token={token || ""} eventName={eventName} maxShots={70} />
    </div>
  );
}
