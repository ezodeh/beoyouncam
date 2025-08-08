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
      {/* واجهة الكاميرا الكاملة */}
      <MobileCamera token={token || ""} eventName={eventName} maxShots={70} />
    </div>
  );
}
