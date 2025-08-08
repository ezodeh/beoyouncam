import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";

export default function Invites() {
  const { token } = useParams();
  const url = typeof window !== "undefined" ? `${window.location.origin}/event/${token}` : "";
  useEffect(() => { document.title = "دعوة الضيوف — من عيونكم"; }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); alert("تم نسخ رابط المناسبة"); } catch (_) {}
  };
  const share = async () => {
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: "رابط المناسبة", url }); } catch (_) {}
    } else { await copy(); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">دعوة الضيوف</h1>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-2">رمز QR</h2>
            <div className="bg-background p-4 rounded-xl inline-block">
              <QRCode value={url} size={168} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-2">مشاركة الرابط</h2>
            <p className="text-sm text-muted-foreground mb-4 break-all">{url}</p>
            <div className="flex gap-3">
              <Button onClick={copy} className="rounded-full">نسخ الرابط</Button>
              <Button variant="outline" onClick={share} className="rounded-full">مشاركة</Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

