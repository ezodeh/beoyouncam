import heroImage from "@/assets/hero-mnaoyonkom.jpg";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PointerGlow from "@/components/visuals/PointerGlow";

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <PointerGlow />
      <div className="container mx-auto grid lg:grid-cols-2 gap-10 items-center py-16">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            ألبوم صور وفيديو جماعي لمناسبتك — بسهولة رابط أو QR
          </h1>
          <p className="text-lg text-muted-foreground">
            ادعُ ضيوفك ليوثّقوا أجمل اللحظات من هواتفهم مباشرة. لا حاجة لتنزيل تطبيق.
          </p>
          <div className="flex items-center gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/choose-plan">اختر خطتك</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/create-event">أنشئ مناسبة</Link>
            </Button>
          </div>
          <ul className="grid grid-cols-2 gap-3 pt-4 text-sm text-muted-foreground">
            <li>• صور غير محدودة في الخطط العليا</li>
            <li>• فيديو 10 ثوانٍ (Premium/Deluxe)</li>
            <li>• روابط وQR/NFC للمشاركة</li>
            <li>• معرض عام قابل للمشاركة</li>
          </ul>
        </div>
        <div className="relative rounded-xl overflow-hidden border shadow">
          <img
            src={heroImage}
            alt="منصة من عيونكم — ألبوم جماعي للمناسبات"
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
