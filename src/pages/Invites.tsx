import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground relative flex flex-col" dir="rtl">
      <Link
        to={`/event/${token}`}
        aria-label="عودة"
        className="absolute top-4 left-4 z-10 inline-flex items-center justify-center rounded-full border border-border bg-background p-2"
      >
        <X className="h-6 w-6" />
      </Link>
      <main className="flex-1 container mx-auto px-4 py-10 grid place-items-center">
        <div className="text-center w-full max-w-sm">
          <h1 className="text-3xl font-bold font-nastaliq mb-6">دعوة الضيوف</h1>
          <div className="flex justify-center mb-6">
            <div className="bg-card p-5 rounded-2xl border border-border">
              <QRCode value={url} size={192} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground break-all mb-4">{url}</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={copy} className="rounded-full">نسخ الرابط</Button>
            <Button variant="outline" onClick={share} className="rounded-full">مشاركة</Button>
          </div>
        </div>
      </main>
    </div>
  );
}

