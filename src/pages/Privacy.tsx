import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";

export default function Privacy() {
  useEffect(() => { document.title = "سياسة الخصوصية — من عيونكم"; }, []);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-nastaliq mb-4">سياسة الخصوصية</h1>
        <article className="prose prose-invert max-w-none text-right">
          <p>نحترم خصوصيتك. نستخدم بياناتك لتقديم الخدمة وتحسينها فقط.</p>
          <ul className="list-disc pr-6">
            <li>نخزّن الحد الأدنى من البيانات اللازمة لتشغيل الخدمة.</li>
            <li>يمكنك طلب حذف بياناتك في أي وقت.</li>
            <li>نستخدم التخزين السحابي لاستضافة الصور والفيديو.</li>
          </ul>
          <p>قد نقوم بتحديث هذه السياسة من وقت لآخر. استمرارك يعني الموافقة على التحديثات.</p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
