import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import MobileCamera from "@/components/capture/MobileCamera";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
export default function EventCamera() {
  const navigate = useNavigate();
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "مناسبتكم";
  const queryShots = Number(new URLSearchParams(location.search).get("shots") || "");
  const [maxShots, setMaxShots] = useState<number>(Math.max(1, isNaN(queryShots) ? 120 : queryShots));
  useEffect(() => {
    document.title = `الكاميرا — ${eventName} — من عيونكم`;
  }, [eventName]);

  useEffect(() => {
    const has = localStorage.getItem(`participant:${token}`);
    if (!has) {
      navigate(`/event/${token}/welcome${location.search}`);
    }
  }, [location.search, navigate, token]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data: row } = await supabase
        .from("events")
        .select("max_shots, start_at, end_at")
        .eq("token", token as string)
        .maybeSingle();
      const data: any = row;
      if (data) {
        const row = data as any;
        const now = new Date();
        if (row.start_at && now < new Date(row.start_at)) {
          navigate(`/event/${token}/soon${location.search}`);
          return;
        }
        if (row.end_at && now > new Date(row.end_at)) {
          navigate(`/event/${token}/ended${location.search}`);
          return;
        }
        if (!isNaN(queryShots)) {
          setMaxShots(Math.max(1, queryShots));
        } else if (typeof row.max_shots === "number") {
          setMaxShots(Math.max(1, row.max_shots));
        }
      }
    })();
  }, [location.search, navigate, token]);

  return (
    <div className="h-[100dvh] overflow-hidden overscroll-none bg-background text-foreground relative" dir="rtl">
      <Navbar compact fullBleed />
      {/* واجهة الكاميرا الكاملة */}
      <MobileCamera token={token || ""} eventName={eventName} maxShots={maxShots} />
    </div>
  );
}
