import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import DesktopGate from "@/components/capture/DesktopGate";
import MobileCamera from "@/components/capture/MobileCamera";

export default function Invites() {
  const { token } = useParams();
  useEffect(() => { document.title = "دعوة الضيوف — من عيونكم"; }, []);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">دعوة الضيوف</h1>
        <p className="text-muted-foreground mb-4">أدخل أرقام الهواتف أو استورد ملف جهات الاتصال لإرسال الدعوات لاحقًا (Placeholder).</p>
        <div className="rounded-xl border border-border p-4 bg-card">قريبًا…</div>
        <div className="mt-6"><Link to={`/event/${token}`} className="underline">رجوع للكاميرا</Link></div>
      </main>
      <Footer />
    </div>
  );
}
