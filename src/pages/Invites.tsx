import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
export default function Invites() {
  const {
    token
  } = useParams();
  const url = typeof window !== "undefined" ? `${window.location.origin}/event/${token}/welcome` : "";
  const [emails, setEmails] = useState<string>("");
  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    document.title = "دعوة الضيوف — عيون cam";
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("تم نسخ رابط المناسبة");
    } catch (_) {}
  };
  const share = async () => {
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "رابط المناسبة",
          url
        });
      } catch (_) {}
    } else {
      await copy();
    }
  };
  const shareEmail = () => {
    const subject = encodeURIComponent("دعوة للمشاركة في ألبوم المناسبة");
    const body = encodeURIComponent(`تفضّلوا بالانضمام ومشاركة الصور:\n${url}`);
    const bcc = encodeURIComponent(emails);
    window.location.href = `mailto:?subject=${subject}&body=${body}&bcc=${bcc}`;
  };
  const downloadQR = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const img = new Image();
    const blob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8"
    });
    const urlObj = URL.createObjectURL(blob);
    img.onload = () => {
      canvas.width = img.width * 4; // upscale
      canvas.height = img.height * 4;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = `invite-${token}.png`;
      a.click();
      URL.revokeObjectURL(urlObj);
    };
    img.src = urlObj;
  };
  return <div className="min-h-screen bg-background text-foreground flex flex-col relative" dir="rtl">
      <button 
        onClick={() => window.history.back()} 
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background border border-border"
        aria-label="إغلاق"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <Navbar compact fullBleed />
      <main className="flex-1 container mx-auto px-4 py-8 grid place-items-center">
        <div className="text-center w-full max-w-sm">
          <h1 className="text-3xl font-bold font-nastaliq mb-6">دعوة الضيوف</h1>
          <div className="flex justify-center mb-6">
            <div className="bg-card p-5 rounded-2xl border border-border">
              <QRCode value={url} size={192} ref={svgRef as any} />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground break-all mb-4">{url}</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Button onClick={copy} className="rounded-full">نسخ الرابط</Button>
            <Button variant="outline" onClick={share} className="rounded-full">مشاركة</Button>
            <Button variant="secondary" onClick={downloadQR} className="rounded-full">تنزيل الباركود</Button>
          </div>

          {/* NFC Share Button */}
          <div className="mt-6">
            <Button 
              variant="outline" 
              className="rounded-full w-full"
              onClick={async () => {
                // Check if we're on HTTPS
                if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                  alert("مشاركة NFC تحتاج HTTPS - استخدم النسخة المنشورة من التطبيق");
                  return;
                }

                // Check for NFC support
                if (!('NDEFWriter' in window)) {
                  alert("NFC غير مدعوم على هذا المتصفح. يعمل فقط على Chrome Android");
                  return;
                }

                try {
                  const ndef = new (window as any).NDEFWriter();
                  await ndef.write({
                    records: [{ recordType: "url", data: url }]
                  });
                  alert("✅ تم تفعيل NFC! قرب الهاتف من هاتف آخر يدعم NFC");
                } catch (error: any) {
                  if (error.name === 'NotAllowedError') {
                    alert("يرجى السماح باستخدام NFC في إعدادات المتصفح");
                  } else if (error.name === 'NotSupportedError') {
                    alert("هذا الجهاز لا يدعم NFC");
                  } else {
                    alert("خطأ في تفعيل NFC: " + error.message);
                  }
                }
              }}
            >
              📱 مشاركة عبر NFC
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              يعمل على Chrome Android + HTTPS فقط
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>;
}