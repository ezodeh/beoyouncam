import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import MobileCamera from "@/components/capture/MobileCamera";
import Navbar from "@/components/layout/Navbar";
export default function EventCamera() {
  const navigate = useNavigate();
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "مناسبتكم";
  const shotsParam = Math.max(1, Number(new URLSearchParams(location.search).get("shots") || 0) || 120);
  useEffect(() => {
    document.title = `الكاميرا — ${eventName} — من عيونكم`;
  }, [eventName]);

  useEffect(() => {
    const has = localStorage.getItem(`participant:${token}`);
    if (!has) {
      navigate(`/event/${token}/welcome${location.search}`);
    }
  }, [location.search, navigate, token]);

  return (
    <div className="h-[100dvh] overflow-hidden overscroll-none bg-background text-foreground relative" dir="rtl">
      <Navbar compact fullBleed />
      {/* واجهة الكاميرا الكاملة */}
      <MobileCamera token={token || ""} eventName={eventName} maxShots={shotsParam} />
    </div>
  );
}
