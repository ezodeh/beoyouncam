import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
const CreateEvent = () => {
  useEffect(() => {
    document.title = "إنشاء مناسبة — من عيونكم";
  }, []);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم حفظ النموذج",
      description: "سيتم تفعيل الإنشاء عند ربط الدفع وSupabase."
    });
  };
  return <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="font-aref text-center font-extrabold text-5xl">بيانات المناسبة</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6" onSubmit={onSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm">اسمك الكامل</label>
                  <Input placeholder="الاسم" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm">اسم المناسبة</label>
                  <Input placeholder="مثال: زفاف سارة و عمر" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm">التاريخ والوقت</label>
                  <Input type="datetime-local" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm">تقدير عدد الضيوف</label>
                  <Input type="number" min={1} placeholder="مثال: 120" />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm">رسالة ترحيب قصيرة</label>
                <Textarea placeholder="سعداء بوجودكم! شاركونا لحظاتكم الجميلة." />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" variant="hero">إنشاء المناسبة</Button>
                <Button type="button" variant="outline">رفع غلاف (لاحقًا)</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>;
};
export default CreateEvent;