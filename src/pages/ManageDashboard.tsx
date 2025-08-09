import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";

const ManageDashboard = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    document.title = "لوحة التحكم — من عيونكم";
  }, []);

  useEffect(() => {
    fetchEventData();
  }, [token]);

  const fetchEventData = async () => {
    if (!token) return;
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("token", token as string)
      .maybeSingle();
    setEventData(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar compact />
        <main className="flex-1 container mx-auto py-12">
          <div className="text-center">جاري التحميل...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar compact />
      <main className="flex-1 container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold mb-2">لوحة التحكم الشاملة</h1>
          <p className="text-muted-foreground">
            {eventData?.title || "مناسبة جديدة"} • رمز الإدارة: {token}
          </p>
        </div>

        <DashboardTabs 
          token={token || ""} 
          eventData={eventData} 
          onEventUpdate={fetchEventData} 
        />
      </main>
      <Footer />
    </div>
  );
};

export default ManageDashboard;
