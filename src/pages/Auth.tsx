import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { document.title = "تسجيل الدخول/التسجيل — من عيونكم"; }, []);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (!error) navigate("/"); else alert(error.message);
  };

  const signUp = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } });
    setLoading(false);
    if (!error) alert("تم إرسال رسالة تأكيد إلى بريدك."); else alert(error.message);
  };

  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
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
              <Label>البريد الإلكتروني</Label>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
              <Label>كلمة المرور</Label>
              <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
              <Button className="w-full rounded-full" disabled={loading} onClick={signUp}>إنشاء حساب</Button>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
