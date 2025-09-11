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
    document.title = "لوحة التحكم بالمناسبة — من عيونكم";
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar compact />
      <main className="flex-1 container mx-auto py-8">
        <div className="mb-6">
          {/* صورة الغطاف في الداشبورد */}
          {eventData?.cover_url && (
            <div className="relative w-full h-48 md:h-64 mb-4 overflow-hidden rounded-lg bg-secondary">
              <img 
                src={eventData.cover_url} 
                alt={`غلاف ${eventData?.title || "المناسبة"}`} 
                className="absolute inset-0 h-full w-full object-cover" 
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/80" />
              <div className="absolute bottom-4 right-4">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">لوحة التحكم بالمناسبة</h1>
                <p className="text-white/90">
                  {eventData?.title || "مناسبة جديدة"} • رمز الإدارة: {token}
                </p>
              </div>
            </div>
          )}
          
          {/* إذا لم تكن هناك صورة غطاء، اعرض التصميم الافتراضي */}
          {!eventData?.cover_url && (
            <>
              <h1 className="text-3xl font-extrabold mb-2">لوحة التحكم بالمناسبة</h1>
              <p className="text-muted-foreground">
                {eventData?.title || "مناسبة جديدة"} • رمز الإدارة: {token}
              </p>
            </>
          )}
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
