import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, useLocation, Link } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-mnaoyonkom.jpg";
import { supabase } from "@/integrations/supabase/client";

export default function EventSoon() {
  const { token } = useParams();
  const location = useLocation();
  const [startAt, setStartAt] = useState<string | null>(null);
  const [eventImage, setEventImage] = useState<string>(heroImage);
  const eventName = new URLSearchParams(location.search).get("title") || "مناسبتكم";
  const isAlbumPage = location.search.includes("title="); // Detect if this is for album

  useEffect(() => {
    if (isAlbumPage) {
      document.title = `لم ينشر بعد — ${eventName} — من عيونكم`;
    } else {
      document.title = `قريبًا — ${eventName} — من عيونكم`;
    }
  }, [eventName, isAlbumPage]);

  const target = startAt ? new Date(startAt) : null;
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = useMemo(() => {
    if (!target) return null;
    const ms = target.getTime() - now.getTime();
    const clamped = Math.max(0, ms);
    const totalSeconds = Math.floor(clamped / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return { d, h, m, s };
  }, [target, now]);

  useEffect(() => {
    // read from URL for now, EventWelcome/Camera add it when redirecting
    const s = new URLSearchParams(location.search).get("start_at");
    if (s) setStartAt(s);
  }, [location.search]);

  // Fetch event image from database
  useEffect(() => {
    (async () => {
      if (!token) return;
      
      try {
        const { data } = await supabase
          .from("events")
          .select("cover_url, album_cover_url")
          .eq("token", token)
          .maybeSingle();
        
        if (data) {
          // Use album cover for album page, event cover for event page
          const imageUrl = isAlbumPage ? data.album_cover_url : data.cover_url;
          if (imageUrl) {
            setEventImage(imageUrl);
            console.log("🖼️ Updated event image:", imageUrl);
          }
        }
      } catch (error) {
        console.error("Error loading event image:", error);
      }
    })();
  }, [token, isAlbumPage]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar compact fullBleed />
      <figure className="relative w-full mb-3 overflow-hidden bg-secondary rounded-none">
        <div className="relative h-[38vh] md:h-[48vh]">
          <img src={eventImage} alt={`صورة ${eventName}`} className="absolute inset-0 h-full w-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
        </div>
      </figure>
      <main className="container mx-auto px-4 py-4 flex-1 grid place-items-center">
        <section className="max-w-md mx-auto text-center">
          {isAlbumPage ? (
            <>
              <h1 className="font-nastaliq text-4xl md:text-5xl leading-snug">ألبوم {eventName}</h1>
              <p className="mt-3 text-muted-foreground">لم يتم نشر الألبوم بعد</p>
            </>
          ) : (
            <>
              <h1 className="font-nastaliq text-4xl md:text-5xl leading-snug">{eventName}</h1>
              <p className="mt-3 text-muted-foreground">المناسبة لسه ما بدأت — جهّزوا حالكم!</p>
            </>
          )}
          
          {/* Show countdown only for events, not albums */}
          {diff && !isAlbumPage && (
            <div className="mt-6 grid grid-flow-col gap-3 auto-cols-fr text-center">
              {([['أيام', diff.d], ['ساعات', diff.h], ['دقائق', diff.m], ['ثواني', diff.s]] as const).map(([label, val]) => (
                <div key={label} className="rounded-xl border bg-card p-3">
                  <div className="text-3xl font-bold tabular-nums">{String(val).padStart(2, '0')}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button className="rounded-full px-8" onClick={() => navigator.clipboard.writeText(window.location.href)}>انسخ الرابط</Button>
            {/* Show back to welcome button only for events, not albums */}
            {!isAlbumPage && (
              <Button asChild variant="outline" className="rounded-full px-8">
                <Link to={`/event/${token}/welcome${location.search}`}>العودة للترحيب</Link>
              </Button>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
