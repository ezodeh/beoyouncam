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
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="container mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-bold mb-2">ماسح رمز QR</h1>
          <p className="text-muted-foreground">وجّه الكاميرا نحو رمز الـ QR للانضمام للمناسبة</p>
        </div>

        {/* Scanner Container */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="relative w-full max-w-lg mx-auto">
            {/* Camera Preview */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted border-2 border-border shadow-xl">
              <QRScanner
                constraints={{ 
                  facingMode: "environment",
                  width: { ideal: 1920, min: 1280 },
                  height: { ideal: 1920, min: 1280 },
                  aspectRatio: 1.0
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
                      window.location.href = value;
                    }
                  } catch {
                    window.location.href = value;
                  }
                }}
                onError={(err) => {
                  console.error(err);
                  toast({ title: "تعذّر قراءة الرمز", description: "حاول تحسين الإضاءة أو تقريب الكاميرا" });
                }}
                styles={{
                  container: {
                    width: "100%",
                    height: "100%",
                    position: "relative"
                  },
                  video: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scale(1.2)",
                    transformOrigin: "center"
                  }
                }}
              />
              
              {/* QR Scanner Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Dark overlay with cutout */}
                <div className="absolute inset-0 bg-black/50">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-transparent border-2 border-primary rounded-2xl shadow-2xl">
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-2 top-2 h-1 bg-primary rounded-full opacity-80 animate-pulse shadow-lg shadow-primary/50"></div>
                  </div>
                </div>
                
                {/* Central target */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
                </div>
                
                {/* Instructions overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 border border-border">
                  <p className="text-sm font-medium text-center">ضع الرمز داخل الإطار الأكبر</p>
                </div>
              </div>
            </div>
            
            {/* Bottom hint */}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                تأكد من وضوح الرمز والإضاءة الجيدة لأفضل النتائج
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
