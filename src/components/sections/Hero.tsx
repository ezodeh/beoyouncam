import heroImage from "@/assets/hero-mnaoyonkom.jpg";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PointerGlow from "@/components/visuals/PointerGlow";
import { toast } from "@/hooks/use-toast";

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
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                toast({
                  title: "قريبًا: دخول Google",
                  description: "سيتوفّر بعد ربط Google و Supabase.",
                })
              }
              aria-label="الدخول عبر Google"
            >
              <span className="flex items-center gap-2">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.94 0 7.5 1.4 10.3 3.7l7.7-7.7C37.7 1.9 31.3 0 24 0 14.6 0 6.4 4.9 1.9 12.1l8.9 6.9C12.9 13.4 17.9 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.5 24.6c0-1.6-.1-2.7-.4-3.9H24v7.4h12.8c-.3 2-1.6 5-4.7 7.1l7.2 5.6c4.3-4 7.2-9.9 7.2-16.2z"/>
                  <path fill="#4A90E2" d="M24 48c6.5 0 12-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.8 2.4-8.7 2.4-6.7 0-12.3-4.5-14.3-10.6l-9 7c4.5 7.2 12.7 12.6 23.3 12.6z"/>
                  <path fill="#FBBC05" d="M9.7 28.4c-.5-1.4-.7-3-.7-4.4s.2-3 .7-4.4l-8.9-6.9C-1 16.1-1 19.9-1 24s0 7.9 1.8 11.3l8.9-6.9z"/>
                </svg>
                <span>الدخول عبر Google</span>
              </span>
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
