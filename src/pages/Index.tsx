import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "من عيونكم — ألبوم صور وفيديو جماعي";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-almarai">
      <Navbar />
      <main className="flex-1">
        <Hero />
        {/* ... keep existing code (additional sections can be added here) */}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
