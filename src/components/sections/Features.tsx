import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Share2, Users, Download, QrCode, Globe } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Camera,
      title: "بعيون أصحابك",
      description: "كل صاحب يوثّق اللحظات من زاويته الخاصة، فتحصل على ذكريات من كل الجهات"
    },
    {
      icon: Share2,
      title: "مشاركة بسيطة",
      description: "رابط واحد أو رمز QR يكفي ليبدأ أصحابك بتوثيق اللحظات معك"
    },
    {
      icon: Users,
      title: "لحظات جماعية",
      description: "اجمع ذكريات كل المشاركين في مكان واحد وشاهدها تتجمع أمام عينيك"
    },
    {
      icon: Download,
      title: "كل الذكريات معك",
      description: "في نهاية المناسبة، حمّل كل الصور والفيديوهات بضغطة واحدة"
    },
    {
      icon: QrCode,
      title: "وصول سهل",
      description: "رموز QR مطبوعة في المناسبة تخلّي الوصول للألبوم سهل من أي مكان"
    },
    {
      icon: Globe,
      title: "ألبوم خاص أو عام",
      description: "اختر إن كنت تريد مشاركة الألبوم مع الجمهور أو إبقاؤه بين الأصحاب فقط"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">شوف مناسبتك بعيون أصحابك</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            كل صاحب عنده منظور مختلف ولقطة خاصة، اجمع كل هاي اللقطات في مكان واحد
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