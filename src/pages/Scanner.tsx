import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner as QRScanner } from "@yudiel/react-qr-scanner";

export default function Scanner() {
  const navigate = useNavigate();
  useEffect(() => { document.title = "ماسح QR — من عيونكم"; }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 grid place-items-center">
        <div className="w-full max-w-md grid gap-4">
          <h1 className="text-2xl font-bold text-center">ماسح الباركود</h1>
          <QrScanner
            containerStyle={{ width: "100%" }}
            onDecode={(res) => {
              try {
                const url = new URL(res);
                const m = url.pathname.match(/\/event\/([^/]+)\/(welcome|camera|submit|soon|ended)?/);
                if (m) {
                  navigate(url.pathname + url.search);
                } else {
                  window.location.href = res; // فتح أي رابط آخر
                }
              } catch {
                // ليس رابطًا صالحًا
              }
            }}
            onError={() => {}}
          />
          <p className="text-xs text-muted-foreground text-center">وجّه الكاميرا نحو رمز الـ QR لفتح الرابط.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
