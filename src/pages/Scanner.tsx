import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner as QRScanner } from "@yudiel/react-qr-scanner";
import { useToast } from "@/hooks/use-toast";
export default function Scanner() {
  const navigate = useNavigate();
  const { toast } = useToast();
  useEffect(() => { document.title = "ماسح QR — من عيونكم"; }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 grid place-items-center">
        <div className="w-full max-w-md grid gap-4">
          <h1 className="text-2xl font-bold text-center">ماسح الباركود</h1>
<QRScanner
            constraints={{ facingMode: "environment" }}
            onScan={(detected: any[]) => {
              const value = detected?.[0]?.rawValue as string | undefined;
              if (!value) return;
              try {
                const url = new URL(value);
                const m = url.pathname.match(/\/event\/([^/]+)\/(welcome|camera|submit|soon|ended)?/);
                if (m) {
                  navigate(url.pathname + url.search);
                } else {
                  window.location.href = value; // فتح أي رابط آخر
                }
              } catch {
                // ليس رابطًا صالحًا
                window.location.href = value;
              }
            }}
            onError={(err) => {
              console.error(err);
              toast({ title: "تعذّر قراءة الرمز", description: "حاول الإضاءة/تقريب الكاميرا ثم أعد المحاولة" });
            }}
          />
          <p className="text-xs text-muted-foreground text-center">وجّه الكاميرا نحو رمز الـ QR لفتح الرابط.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
