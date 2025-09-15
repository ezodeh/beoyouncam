import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import MobileCamera from "@/components/capture/MobileCamera";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
export default function EventCamera() {
  const navigate = useNavigate();
  const { token } = useParams();
  const location = useLocation();
  const initialName = new URLSearchParams(location.search).get("title") || "مناسبتكم";
  const [eventTitle, setEventTitle] = useState<string>(initialName);
  const queryShots = Number(new URLSearchParams(location.search).get("shots") || "");
  const [maxShots, setMaxShots] = useState<number>(Math.max(1, isNaN(queryShots) ? 120 : queryShots));
  const [enableVideo, setEnableVideo] = useState<boolean>(true);
  useEffect(() => {
    document.title = `الكاميرا — ${eventTitle} — عيون cam`;
  }, [eventTitle]);

  useEffect(() => {
    const has = localStorage.getItem(`participant:${token}`);
    if (!has) {
      navigate(`/event/${token}/welcome${location.search}`);
    }
  }, [location.search, navigate, token]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data } = await supabase
        .rpc("get_public_event_info", { event_token: token as string });
      if (data && data.length > 0) {
        const eventData = data[0];
        setEventTitle(eventData.title || initialName);
        const now = new Date();
        if (eventData.start_at && now < new Date(eventData.start_at)) {
          const qs = new URLSearchParams(location.search);
          qs.set("start_at", eventData.start_at);
          navigate(`/event/${token}/soon?${qs.toString()}`);
          return;
        }
        if (eventData.end_at && now > new Date(eventData.end_at)) {
          const qs = new URLSearchParams(location.search);
          qs.set("end_at", eventData.end_at);
          navigate(`/event/${token}/ended?${qs.toString()}`);
          return;
        }
        console.log("🔢 EventCamera: Database data - max_shots:", eventData.max_shots, "queryShots:", queryShots);
        if (!isNaN(queryShots) && queryShots > 0) {
          console.log("🔢 EventCamera: Using query shots:", queryShots);
          setMaxShots(Math.max(1, queryShots));
        } else if (typeof eventData.max_shots === "number" && eventData.max_shots > 0) {
          console.log("🔢 EventCamera: Using database max_shots:", eventData.max_shots);
          setMaxShots(Math.max(1, eventData.max_shots));
        }
        
        // Set video enable/disable from database
        if (typeof eventData.enable_video === "boolean") {
          setEnableVideo(eventData.enable_video);
          console.log("🎥 EventCamera: Video setting from DB:", eventData.enable_video);
        }
        
        console.log("🔢 EventCamera: Final maxShots will be:", typeof eventData.max_shots === "number" ? eventData.max_shots : queryShots);
      }
    })();
  }, [location.search, navigate, token]);

  return (
    <div className="h-[100dvh] overflow-hidden overscroll-none bg-black text-white relative" dir="rtl">
      {/* واجهة الكاميرا الكاملة */}
      <MobileCamera token={token || ""} eventName={eventTitle} maxShots={maxShots} enableVideo={enableVideo} />
    </div>
  );
}
