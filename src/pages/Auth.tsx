import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false); // مطلوب للتسجيل فقط
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState<"male"|"female"|"other">("male");
  const [birthdate, setBirthdate] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => { document.title = "تسجيل الدخول/التسجيل — من عيونكم"; }, []);

const signIn = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setLoading(false);
  if (!error) navigate("/"); else alert(error.message);
};

const signUp = async () => {
  if (!agree) { alert("الرجاء الموافقة على الشروط"); return; }
  setLoading(true);
  const redirectUrl = `${window.location.origin}/`;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } });
  setLoading(false);
  if (error) { alert(error.message); return; }
  try {
    const pending = { phone, country, gender, birthdate: birthdate || null, agreed_terms_at: new Date().toISOString() };
    localStorage.setItem("pendingProfile", JSON.stringify(pending));
    const uid = data.user?.id;
    if (uid) {
      await supabase.from("profiles").upsert({ id: uid, phone, country, gender, birthdate: birthdate || null, agreed_terms_at: new Date().toISOString() });
    }
  } catch {}
  alert("تم إرسال رسالة تأكيد إلى بريدك.");
};

const signInGoogle = async () => {
  await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/` } });
};

const signUpGoogle = async () => {
  if (!agree) { alert("الرجاء الموافقة على الشروط"); return; }
  try {
    const pending = { phone, country, gender, birthdate: birthdate || null, agreed_terms_at: new Date().toISOString() };
    localStorage.setItem("pendingProfile", JSON.stringify(pending));
  } catch {}
  await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/` } });
};
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 grid place-items-center">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-extrabold text-center mb-6">أهلاً بك</h1>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="signup">تسجيل حساب</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4 grid gap-3">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
              <Label>كلمة المرور</Label>
              <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
<Button className="w-full rounded-full" disabled={loading} onClick={signIn}>دخول</Button>
<Button variant="secondary" className="w-full rounded-full" onClick={signInGoogle}>المتابعة بـ Google</Button>
            </TabsContent>
<TabsContent value="signup" className="mt-4 grid gap-3">
              <Label className="text-right">البريد الإلكتروني</Label>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="text-right" />
              <Label className="text-right">كلمة المرور</Label>
              <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" className="text-right" />

              <Label className="text-right">الهاتف</Label>
              <Input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="05xxxxxxxx" className="text-right" />

              <Label className="text-right">البلد</Label>
              <Input type="text" value={country} onChange={(e)=>setCountry(e.target.value)} placeholder="السعودية" className="text-right" />

              <div className="grid gap-2">
                <Label className="text-right">النوع</Label>
                <RadioGroup value={gender} onValueChange={(v)=>setGender(v as any)} className="flex items-center gap-4 justify-end">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Label htmlFor="g-male">ذكر</Label>
                    <RadioGroupItem id="g-male" value="male" />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Label htmlFor="g-female">أنثى</Label>
                    <RadioGroupItem id="g-female" value="female" />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Label htmlFor="g-other">أخرى</Label>
                    <RadioGroupItem id="g-other" value="other" />
                  </div>
                </RadioGroup>
              </div>

              <Label className="text-right">تاريخ الميلاد</Label>
              <Input type="date" value={birthdate} onChange={(e)=>setBirthdate(e.target.value)} className="text-right" />

              <label className="flex items-center gap-2 text-sm mt-1 justify-end">
                <span>أوافق على <a href="/terms" className="underline story-link">شروط الاستخدام</a></span>
                <Checkbox checked={agree} onCheckedChange={(v:any)=> setAgree(Boolean(v))} />
              </label>

              <Button className="w-full rounded-full" disabled={loading || !agree} onClick={signUp}>إنشاء حساب</Button>
              <Button variant="secondary" className="w-full rounded-full" disabled={!agree} onClick={signUpGoogle}>التسجيل بـ Google</Button>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
