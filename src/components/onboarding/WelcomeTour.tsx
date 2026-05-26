import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, PlusCircle, Camera, Users, Share2, Eye, PartyPopper } from "lucide-react";
import { Link } from "react-router-dom";

interface WelcomeTourProps {
  onClose: () => void;
}

export default function WelcomeTour({ onClose }: WelcomeTourProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <PlusCircle className="h-8 w-8 text-primary" />,
      title: "أنشئ مناسبتك",
      description: "ابدأ بإنشاء مناسبة جديدة (زفاف، عيد ميلاد، تخرج، إلخ) وحدد التفاصيل الأساسية."
    },
    {
      icon: <Share2 className="h-8 w-8 text-primary" />,
      title: "شارك الرابط",
      description: "احصل على رابط خاص أو رمز QR لمشاركته مع الضيوف ليتمكنوا من رفع الصور والفيديو."
    },
    {
      icon: <Camera className="h-8 w-8 text-primary" />,
      title: "التقط اللحظات",
      description: "الضيوف يمكنهم التقاط الصور والفيديو مباشرة من الموقع أو رفع ما لديهم من المعرض."
    },
    {
      icon: <Eye className="h-8 w-8 text-primary" />,
      title: "شاهد الذكريات",
      description: "اجمع كل الصور والفيديو في ألبوم واحد واستمتع بمشاهدة اللحظات من عيون الجميع."
    }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 p-1 hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <CardHeader className="text-center pt-12">
          <div className="flex justify-center mb-4">
            {steps[step].icon}
          </div>
          <CardTitle className="text-xl flex items-center gap-2">أهلاً بك في عيون cam! <PartyPopper className="text-primary" /></CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-2">{steps[step].title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {steps[step].description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2 space-x-reverse">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                السابق
              </Button>
            )}
            
            {step < steps.length - 1 ? (
              <Button onClick={nextStep} className="flex-1">
                التالي
              </Button>
            ) : (
              <div className="flex-1 space-y-2">
                <Button asChild className="w-full">
                  <Link to="/create-event" onClick={onClose}>
                    <PlusCircle className="h-4 w-4 ml-2" />
                    ابدأ الآن
                  </Link>
                </Button>
                <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground hover:bg-transparent hover:text-foreground">
                  تخطي
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}