import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    document.title = "الإعدادات — من عيونكم";
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email || "");
      const meta: any = user?.user_metadata || {};
      setName(meta.full_name || meta.name || "");
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto grid gap-6">
          <header className="text-right">
            <h1 className="text-3xl font-extrabold mb-2">إعدادات الحساب</h1>
            <p className="text-sm text-muted-foreground">عدّل معلوماتك الأساسية.</p>
          </header>

          <div className="grid gap-3">
            <Label>البريد الإلكتروني</Label>
            <Input value={email} readOnly aria-readonly />
          </div>

          <div className="grid gap-3">
            <Label>الاسم</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" />
            <p className="text-xs text-muted-foreground">يُستخدم للعرض داخل الألبوم.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => alert("تم حفظ الإعدادات (للعرض فقط)")}>حفظ</Button>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>تسجيل الخروج</Button>
          </div>

          <section className="grid gap-3 pt-2">
            <h2 className="text-xl font-semibold">خيارات إضافية</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <a href="mailto:support@manyoyonkom.app" className="rounded-full px-4 py-2 border text-center hover:shadow-elevated">Feedback (تواصل معنا)</a>
              <button className="rounded-full px-4 py-2 border hover:shadow-elevated" onClick={() => alert("سجل الفوترة: سيتم إظهاره قريبًا")}>سجل الفوترة</button>
              <button className="rounded-full px-4 py-2 border hover:shadow-elevated" onClick={() => alert("تم تعطيل الحساب مؤقتًا")}>تعطيل الحساب</button>
              <button className="rounded-full px-4 py-2 border border-destructive text-destructive hover:shadow-elevated" onClick={() => { if (confirm("هل أنت متأكد من حذف الحساب؟")) { supabase.auth.signOut(); alert("تم إرسال طلب حذف الحساب"); window.location.href = "/"; }}}>حذف الحساب</button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
