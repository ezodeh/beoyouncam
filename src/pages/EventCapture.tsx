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

  useEffect(() => {
    document.title = `التقاط — ${title} — من عيونكم`;
  }, [title]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data } = await supabase
        .from("events")
        .select("max_shots, title")
        .eq("token", token)
        .maybeSingle();
      if (data) {
        setTitle(data.title || initialName);
        if (typeof data.max_shots === "number") setMaxShots(Math.max(1, data.max_shots));
      }
    })();
  }, [token]);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(ua);
  const isNarrow = typeof window !== "undefined" ? window.innerWidth < 900 : false;
  const isMobile = isMobileUA && isNarrow;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isMobile ? (
        <>
          <Navbar compact />
          <main className="flex-1">
            <DesktopGate />
          </main>
          <Footer />
        </>
      ) : (
        <MobileCamera token={token || ""} eventName={title} maxShots={maxShots} />
      )}
    </div>
  );
};

export default EventCapture;
