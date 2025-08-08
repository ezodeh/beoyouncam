import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";

const AdminDashboard = () => {
  useEffect(() => {
    document.title = "لوحة الإدارة — من عيونكم";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-12 space-y-4">
        <h1 className="text-3xl font-extrabold">لوحة الإدارة (SaaS)</h1>
        <p className="text-muted-foreground">
          هذه الصفحة ستُفعّل بعد ربط Supabase (جداول، RLS، وتحليلات) + Stripe. سنقوم بإعدادها فور ربط التكاملات.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
