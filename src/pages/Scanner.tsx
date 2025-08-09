import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner as QRScanner } from "@yudiel/react-qr-scanner";
import { useToast } from "@/hooks/use-toast";
export default function Scanner() {
  const navigate = useNavigate();
  const { toast } = useToast();
  useEffect(() => { document.title = "ماسح QR — عيون cam"; }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 grid place-items-center">
        <div className="w-full max-w-lg grid gap-4">
          <h1 className="text-2xl font-bold text-center">ماسح الباركود</h1>
          <div className="relative w-full aspect-square max-w-xs sm:max-w-sm md:max-w-md mx-auto rounded-lg overflow-hidden border border-border bg-muted">
            <QRScanner
              constraints={{ 
                facingMode: { exact: "environment" },
                width: { ideal: 720 },
                height: { ideal: 720 }
              }}
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
              styles={{
                container: {
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative"
                },
                video: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }
              }}
            />
            
            {/* QR Scanner Overlay with Rainbow Gradient */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-48 h-48">
                {/* Corner brackets with gradient */}
                <div className="absolute top-0 left-0 w-8 h-8">
                  <div className="w-full h-1 bg-brand-gradient rounded-full"></div>
                  <div className="w-1 h-full bg-brand-gradient rounded-full"></div>
                </div>
                <div className="absolute top-0 right-0 w-8 h-8">
                  <div className="w-full h-1 bg-brand-gradient rounded-full"></div>
                  <div className="w-1 h-full bg-brand-gradient rounded-full ml-auto"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-8 h-8">
                  <div className="w-1 h-full bg-brand-gradient rounded-full"></div>
                  <div className="w-full h-1 bg-brand-gradient rounded-full mt-auto"></div>
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8">
                  <div className="w-1 h-full bg-brand-gradient rounded-full ml-auto"></div>
                  <div className="w-full h-1 bg-brand-gradient rounded-full mt-auto"></div>
                </div>
                
                {/* Scanning line animation */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-gradient animate-pulse shadow-lg opacity-80"></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">وجّه الكاميرا نحو رمز الـ QR لفتح الرابط.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
