import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

const EventCapture = () => {
  const { token } = useParams();

  useEffect(() => {
    document.title = "التقاط — من عيونكم";
  }, []);

  const soon = (action: string) => () => toast({ title: action, description: "سيُفعّل بعد تكامل التخزين والمعالجة." });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-12 space-y-6">
        <h1 className="text-2xl font-bold">رابط الضيوف</h1>
        <p className="text-muted-foreground">رمز المناسبة: {token}</p>
        <div className="flex items-center gap-3">
          <Button variant="hero" onClick={soon("رفع صورة")}>رفع صورة</Button>
          <Button variant="secondary" onClick={soon("تسجيل 10s")}>تسجيل 10s</Button>
        </div>
        <p className="text-sm text-muted-foreground">يتم ضغط الصور وحماية الخصوصية بإزالة EXIF لاحقًا.</p>
      </main>
      <Footer />
    </div>
  );
};

export default EventCapture;
