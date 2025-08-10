import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: "1",
      title: "أنشئ مناسبتك",
      description: "سجّل دخول وأنشئ مناسبة جديدة بتفاصيل بسيطة كالاسم والتاريخ"
    },
    {
      step: "2", 
      title: "شارك مع الضيوف",
      description: "أرسل رابط المناسبة أو رمز QR للضيوف عبر الواتساب أو أي وسيلة أخرى"
    },
    {
      step: "3",
      title: "الضيوف يوثّقون",
      description: "الضيوف يدخلون الرابط ويبدؤون بتوثيق اللحظات من زاويتهم الخاصة"
    },
    {
      step: "4",
      title: "استمتع بالذكريات",
      description: "اجمع كل الذكريات كما رآها ضيوفك واحفظها للأبد"
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">كيف يعمل؟</h2>
          <p className="text-xl text-muted-foreground">
            أربع خطوات بسيطة لترى مناسبتك بعيون ضيوفك
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" dir="rtl">
          {steps.map((step, index) => (
            <Card key={index} className="text-center relative">
              <CardHeader>
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.step}
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {step.description}
                </CardDescription>
              </CardContent>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -left-3 transform -translate-y-1/2">
                  <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            * مجاناً لحد 5 ضيوف، 10 لقطات بدون الميزات الإضافية
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;