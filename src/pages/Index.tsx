import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import UseCases from "@/components/sections/UseCases";
import HowItWorks from "@/components/sections/HowItWorks";
import CallToAction from "@/components/sections/CallToAction";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
const Index = () => {
  const { user, loading } = useAuth();
  useEffect(() => {
    document.title = "عيون cam — ألبوم صور وفيديو جماعي";
  }, []);

  // Logged-in users see their dashboard instead of the landing page
  if (!loading && user) {
    return <Navigate to="/account" replace />;
  }

  return <div className="min-h-screen bg-background text-foreground flex flex-col font-almarai">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <UseCases />
        <HowItWorks />
        <CallToAction />
      </main>
      <Footer />
    </div>;
};
export default Index;