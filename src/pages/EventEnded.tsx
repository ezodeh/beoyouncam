import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLocation, useParams, Link } from "react-router-dom";
import React, { useEffect } from "react";
import heroImage from "@/assets/hero-mnaoyonkom.jpg";
import { Button } from "@/components/ui/button";

export default function EventEnded() {
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "مناسبتكم";

  useEffect(() => {
    document.title = `انتهت المناسبة — ${eventName} — من عيونكم`;
  }, [eventName]);

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
          <p className="mt-3 text-muted-foreground">شكراً لمشاركتكم — المناسبة خلصت. تقدروا تشوفوا الألبوم الآن.</p>
          <div className="mt-6">
            <Link to={`/album/${token}${location.search}`}>
              <Button className="rounded-full px-8">اذهب إلى الألبوم</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
