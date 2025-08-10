import heroImage from "@/assets/hero-mnaoyonkom.jpg";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import PointerGlow from "@/components/visuals/PointerGlow";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden">
      <PointerGlow />
      <div className="container mx-auto grid lg:grid-cols-2 gap-10 items-center py-16">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight font-nastaliq">
            ألبوم صور وفيديو جماعي لمناسبتك — بسهولة رابط أو QR
          </h1>
          <p className="text-lg text-muted-foreground">
            ادعُ ضيوفك ليوثّقوا أجمل اللحظات من هواتفهم مباشرة. لا حاجة لتنزيل تطبيق.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="hero"
              size="lg"
              onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                  navigate("/auth");
                } else {
                  navigate("/create-event");
                }
              }}
            >
              أنشئ مناسبتك الآن
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/scanner">
                <Camera className="h-5 w-5 ml-2" />
                مسح رمز QR
              </Link>
            </Button>
          </div>
          <ul className="grid grid-cols-2 gap-3 pt-4 text-sm text-muted-foreground">
            <li>• جمع الصور والفيديوهات من جميع الضيوف</li>
            <li>• مشاركة فورية عبر رابط أو QR</li>
            <li>• لا حاجة لتنزيل تطبيق</li>
            <li>• معرض خاص قابل للمشاركة</li>
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
