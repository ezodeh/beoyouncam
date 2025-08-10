import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Share2, Users, Download, QrCode, Globe } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Camera,
      title: "التقاط سهل",
      description: "ضيوفك يلتقطون الصور والفيديوهات مباشرة من أجهزتهم بدون تنزيل أي تطبيق"
    },
    {
      icon: Share2,
      title: "مشاركة فورية",
      description: "شارك رابط المناسبة أو رمز QR مع الضيوف ليبدؤوا التوثيق فوراً"
    },
    {
      icon: Users,
      title: "جماعي وتفاعلي",
      description: "كل ضيف يمكنه رؤية ما يشاركه الآخرون في الوقت الفعلي"
    },
    {
      icon: Download,
      title: "تحميل شامل",
      description: "حمّل جميع الصور والفيديوهات بضغطة واحدة في نهاية المناسبة"
    },
    {
      icon: QrCode,
      title: "وصول سريع",
      description: "رموز QR مطبوعة أو NFC للوصول السريع من أي مكان في المناسبة"
    },
    {
      icon: Globe,
      title: "معرض عام",
      description: "اختر مشاركة المعرض مع الجمهور أو إبقاؤه خاصاً للمدعوين فقط"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">لماذا عيون cam؟</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            الطريقة الأسهل والأذكى لجمع جميع ذكريات مناسبتك في مكان واحد
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;