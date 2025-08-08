import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

const Payment = () => {
  useEffect(() => {
    document.title = "الدفع — من عيونكم";
  }, []);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("plan") === "basic") {
      navigate("/create-event", { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSoon = (label: string) => () => {
    toast({ title: `${label}`, description: "قريبًا — سنفعل بوابة الدفع خلال الإعداد." });
  };
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-12">
        <h1 className="text-3xl font-extrabold mb-8 text-center">الدفع</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6 space-y-3">
            <h2 className="font-bold">Stripe</h2>
            <p className="text-sm text-muted-foreground">بطاقات ائتمانية ودعم عالمي</p>
            <Button variant="hero" onClick={handleSoon("Stripe")}>تابع عبر Stripe</Button>
          </div>
          <div className="border rounded-lg p-6 space-y-3">
            <h2 className="font-bold">Bit</h2>
            <p className="text-sm text-muted-foreground">ادفع وارفع إيصالاً للمراجعة اليدوية</p>
            <Button variant="secondary" onClick={handleSoon("Bit")}>المتابعة</Button>
          </div>
          <div className="border rounded-lg p-6 space-y-3">
            <h2 className="font-bold">تحويل بنكي</h2>
            <p className="text-sm text-muted-foreground">تفاصيل الحساب + رفع إيصال</p>
            <Button variant="secondary" onClick={handleSoon("تحويل بنكي")}>المتابعة</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
