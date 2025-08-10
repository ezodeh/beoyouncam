import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Camera, GraduationCap, Plane, Gift } from "lucide-react";

const UseCases = () => {
  const useCases = [
    {
      icon: Heart,
      title: "أفراح وأعراس",
      description: "اجمع كل لحظات الفرح من عيون المدعوين والأهل"
    },
    {
      icon: Users,
      title: "مناسبات عائلية",
      description: "لمّة العيلة، جلسات الأصحاب، وكل المناسبات الحميمة"
    },
    {
      icon: Gift,
      title: "أعياد ميلاد",
      description: "كل عيد ميلاد له طقوسه الخاصة، وثّقها من كل الزوايا"
    },
    {
      icon: GraduationCap,
      title: "فعاليات المدارس",
      description: "حفلات التخرج، الأنشطة المدرسية، والفعاليات التعليمية"
    },
    {
      icon: Plane,
      title: "سفر مع الأصحاب",
      description: "رحلات السفر، الكشتات، والمغامرات مع الأصدقاء"
    },
    {
      icon: Camera,
      title: "أي مناسبة خاصة",
      description: "أي لحظة تستحق التوثيق مع الأشخاص المهمين في حياتك"
    }
  ];

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">مناسب لكل المناسبات</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            أي مناسبة تجمعك مع الأشخاص المهمين في حياتك تستحق التوثيق بعيونهم
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <Card key={index} className="h-full text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <useCase.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">{useCase.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {useCase.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;