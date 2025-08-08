import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, useLocation } from "react-router-dom";
import React, { useEffect } from "react";
import DesktopGate from "@/components/capture/DesktopGate";
import MobileCamera from "@/components/capture/MobileCamera";

const EventCapture = () => {
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "مناسبتكم";

  useEffect(() => {
    document.title = `التقاط — ${eventName} — من عيونكم`;
  }, [eventName]);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(ua);
  const isNarrow = typeof window !== "undefined" ? window.innerWidth < 900 : false;
  const isMobile = isMobileUA && isNarrow;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar compact />
      <main className="flex-1">
        {!isMobile ? (
          <DesktopGate />
        ) : (
          <MobileCamera token={token || ""} eventName={eventName} maxShots={70} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EventCapture;
