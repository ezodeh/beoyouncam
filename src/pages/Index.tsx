import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import UseCases from "@/components/sections/UseCases";
import HowItWorks from "@/components/sections/HowItWorks";
import CallToAction from "@/components/sections/CallToAction";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { PlusCircle, Camera, ArrowRight } from "lucide-react";
import WelcomeTour from "@/components/onboarding/WelcomeTour";
const Index = () => {
  const [session, setSession] = useState(null);
  const [hasEvents, setHasEvents] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    document.title = "عيون cam — ألبوم صور وفيديو جماعي";
  }, []);
  useEffect(() => {
    (async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      setSession(session as any);
      if (session?.user?.id) {
        // Check if user has any events
        const {
          data: events
        } = await supabase.from("events").select("id").eq("owner_id", session.user.id).limit(1);
        const hasEvents = (events?.length || 0) > 0;
        setHasEvents(hasEvents);

        // Show onboarding if user is new (no events)
        const seenOnboarding = localStorage.getItem("seenOnboarding");
        if (!hasEvents && !seenOnboarding) {
          setShowOnboarding(true);
        }
      }
    })();
  }, []);
  const closeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("seenOnboarding", "true");
  };
  return <div className="min-h-screen bg-background text-foreground flex flex-col font-almarai">
      <Navbar />
      <main className="flex-1">
        <Hero />
        
        {/* Welcome tour for new users */}
        {showOnboarding && session && <WelcomeTour onClose={closeOnboarding} />}

        {/* Main content sections for all users */}
        {!showOnboarding && <>
            <Features />
            <UseCases />
            <HowItWorks />
            <CallToAction />
          </>}

        {/* Empty state for authenticated users with no events */}
        {session && !hasEvents && !showOnboarding}
      </main>
      <Footer />
    </div>;
};
export default Index;