import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, useLocation } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-mnaoyonkom.jpg";

export default function EventSoon() {
  const { token } = useParams();
  const location = useLocation();
  const [startAt, setStartAt] = useState<string | null>(null);
  const eventName = new URLSearchParams(location.search).get("title") || "مناسبتكم";

  useEffect(() => {
    document.title = `قريبًا — ${eventName} — من عيونكم`;
  }, [eventName]);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar compact fullBleed />
      <figure className="relative w-full mb-3 overflow-hidden bg-secondary rounded-none">
        <div className="relative h-[38vh] md:h-[48vh]">
          <img src={heroImage} alt={`صورة ${eventName}`} className="absolute inset-0 h-full w-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
        </div>
      </figure>
      <main className="container mx-auto px-4 py-4 flex-1 grid place-items-center">
        <section className="max-w-md mx-auto text-center">
          <h1 className="font-nastaliq text-4xl md:text-5xl leading-snug">{eventName}</h1>
          <p className="mt-3 text-muted-foreground">المناسبة لسه ما بدأت — جهّزوا حالكم!</p>
          {diff && (
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
            <Button asChild variant="outline" className="rounded-full px-8"><a href={`/event/${token}/welcome${location.search}`}>العودة للترحيب</a></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
