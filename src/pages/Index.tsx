import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { PlusCircle, Camera, ArrowRight } from "lucide-react";

const Index = () => {
  const [session, setSession] = useState(null);
  const [hasEvents, setHasEvents] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    document.title = "من عيونكم — ألبوم صور وفيديو جماعي";
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session as any);
      
      if (session?.user?.id) {
        // Check if user has any events
        const { data: events } = await supabase
          .from("events")
          .select("id")
          .eq("owner_id", session.user.id)
          .limit(1);
        
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-almarai">
      <Navbar />
      <main className="flex-1">
        <Hero />
        
        {/* Onboarding for new users */}
        {showOnboarding && session && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">أهلاً بك في "من عيونكم"! 🎉</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  اصنع ألبوم جماعي لمناسبتك واجمع كل الذكريات في مكان واحد
                </p>
                <div className="space-y-3">
                  <Button asChild className="w-full" size="lg">
                    <Link to="/create-event" onClick={closeOnboarding}>
                      <PlusCircle className="h-5 w-5 ml-2" />
                      أنشئ مناسبتك الآن
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link to="/scanner" onClick={closeOnboarding}>
                      <Camera className="h-5 w-5 ml-2" />
                      افتح الكاميرا للمشاركة
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={closeOnboarding} className="w-full">
                    إغلاق
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty state for authenticated users with no events */}
        {session && !hasEvents && !showOnboarding && (
          <section className="container mx-auto px-4 py-12">
            <div className="max-w-md mx-auto text-center" dir="rtl">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-2xl font-bold mb-3">أنشئ مناسبتك الآن</h2>
              <p className="text-muted-foreground mb-6">
                ابدأ بإنشاء أول مناسبة لك واجمع كل الصور والذكريات في مكان واحد
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link to="/create-event">
                    <PlusCircle className="h-5 w-5 ml-2" />
                    إنشاء مناسبة جديدة
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/scanner">
                    <Camera className="h-5 w-5 ml-2" />
                    مسح رمز QR للمشاركة
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
