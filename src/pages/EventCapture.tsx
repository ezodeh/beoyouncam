import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import DesktopGate from "@/components/capture/DesktopGate";
import MobileCamera from "@/components/capture/MobileCamera";
import { supabase } from "@/integrations/supabase/client";

const EventCapture = () => {
  const { token } = useParams();
  const location = useLocation();
  const initialName = new URLSearchParams(location.search).get("title") || "مناسبتكم";

  const [title, setTitle] = useState<string>(initialName);
  const [maxShots, setMaxShots] = useState<number>(120);
  const [enableVideo, setEnableVideo] = useState<boolean>(true);

  useEffect(() => {
    document.title = `التقاط — ${title} — من عيونكم`;
  }, [title]);

  useEffect(() => {
    console.log("🔧 EventCapture: Loading event data for token:", token);
    (async () => {
      if (!token) return;
      const { data } = await supabase
        .from("events")
        .select("max_shots, title, enable_video")
        .eq("token", token)
        .maybeSingle();
      console.log("🔧 EventCapture: Event data loaded:", data);
      if (data) {
        setTitle(data.title || initialName);
        if (typeof data.max_shots === "number") setMaxShots(Math.max(1, data.max_shots));
        if (typeof data.enable_video === "boolean") setEnableVideo(data.enable_video);
      }
    })();
  }, [token]);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Touch/i.test(ua);
  const isNarrow = typeof window !== "undefined" ? window.innerWidth < 1024 : false;
  const isMobile = isMobileUA || isNarrow;
  
  console.log("📱 EventCapture: Device detection - UA:", ua);
  console.log("📱 EventCapture: isMobileUA:", isMobileUA, "isNarrow:", isNarrow, "isMobile:", isMobile);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar compact />
      <main className="flex-1">
        {!isMobile ? (
          <DesktopGate />
        ) : (
          <MobileCamera token={token || ""} eventName={title} maxShots={maxShots} enableVideo={enableVideo} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EventCapture;
