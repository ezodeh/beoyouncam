import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Camera, QrCode } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              جاهز لجمع كل ذكريات مناسبتك؟
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              انضم لآلاف المستخدمين الذين يستخدمون عيون cam لجعل مناسباتهم لا تُنسى
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Button asChild size="lg" variant="hero" className="w-full sm:w-auto">
                <Link to="/auth">
                  <Camera className="h-5 w-5 ml-2" />
                  أنشئ مناسبة الآن
                </Link>
              </Button>
              
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/scanner">
                  <QrCode className="h-5 w-5 ml-2" />
                  امسح رمز QR
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span>✓ مجاني للبدء</span>
              <span>✓ بدون تنزيل تطبيق</span>
              <span>✓ سهل الاستخدام</span>
              <span>✓ آمن ومحمي</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;