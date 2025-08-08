import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PricingGrid from "@/components/sections/PricingGrid";
import { useEffect } from "react";

const ChoosePlan = () => {
  useEffect(() => {
    document.title = "اختر خطة — من عيونكم";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PricingGrid />
      </main>
      <Footer />
    </div>
  );
};

export default ChoosePlan;
