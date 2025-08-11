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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false); // مطلوب للتسجيل فقط
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState<"male"|"female"|"other">("female");
  const [birthdate, setBirthdate] = useState<string>("");
  const navigate = useNavigate();

  const countries = [
    "فلسطين", "السعودية", "الإمارات العربية المتحدة", "قطر", "الكويت", "البحرين", "عُمان",
    "الأردن", "لبنان", "سوريا", "العراق", "مصر", "ليبيا", "تونس", 
    "الجزائر", "المغرب", "السودان", "الصومال", "جيبوتي", "موريتانيا", "اليمن"
  ];

  useEffect(() => { 
    document.title = "تسجيل الدخول/التسجيل — من عيونكم"; 
    // تحديد البلد تلقائياً بناءً على الموقع
    detectCountry();
  }, []);

  const detectCountry = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const countryName = data.country_name;
      
      // محاولة تطابق اسم البلد مع القائمة العربية
      const countryMap: { [key: string]: string } = {
        "Saudi Arabia": "السعودية",
        "United Arab Emirates": "الإمارات العربية المتحدة",
        "Qatar": "قطر",
        "Kuwait": "الكويت",
        "Bahrain": "البحرين",
        "Oman": "عُمان",
        "Jordan": "الأردن",
        "Lebanon": "لبنان",
        "Palestine": "فلسطين",
        "Israel": "فلسطين", // إسرائيل = فلسطين المحتلة
        "Syria": "سوريا",
        "Iraq": "العراق",
        "Egypt": "مصر",
        "Libya": "ليبيا",
        "Tunisia": "تونس",
        "Algeria": "الجزائر",
        "Morocco": "المغرب",
        "Sudan": "السودان",
        "Somalia": "الصومال",
        "Djibouti": "جيبوتي",
        "Mauritania": "موريتانيا",
        "Yemen": "اليمن"
      };
      
      const arabicCountry = countryMap[countryName];
      if (arabicCountry) {
        setCountry(arabicCountry);
      }
    } catch (error) {
      console.log('Could not detect country automatically');
    }
  };

const signIn = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setLoading(false);
  if (!error) navigate("/account"); else alert(error.message);
};

const signUp = async () => {
  if (!name.trim()) { alert("الاسم مطلوب"); return; }
  if (!email.trim()) { alert("البريد الإلكتروني مطلوب"); return; }
  if (!password) { alert("كلمة المرور مطلوبة"); return; }
  if (!phone.trim()) { alert("رقم الهاتف مطلوب"); return; }
  if (!country) { alert("اختيار البلد مطلوب"); return; }
  if (!birthdate) { alert("تاريخ الميلاد مطلوب"); return; }
  if (!agree) { alert("الرجاء الموافقة على الشروط"); return; }
  setLoading(true);
  const redirectUrl = `${window.location.origin}/account`;
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password, 
    options: { 
      emailRedirectTo: redirectUrl,
      data: { full_name: name }
    } 
  });
  setLoading(false);
  if (error) { alert(error.message); return; }
  try {
    const pending = { display_name: name, phone, country, gender, birthdate: birthdate || null, agreed_terms_at: new Date().toISOString() };
    localStorage.setItem("pendingProfile", JSON.stringify(pending));
    const uid = data.user?.id;
    if (uid) {
      await supabase.from("profiles").upsert({ id: uid, display_name: name, phone, country, gender, birthdate: birthdate || null, agreed_terms_at: new Date().toISOString() });
    }
  } catch {}
  alert("تم إرسال رسالة تأكيد إلى بريدك.");
};

const signInGoogle = async () => {
  await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/account` } });
};

const signUpGoogle = async () => {
  if (!agree) { alert("الرجاء الموافقة على الشروط"); return; }
  try {
    const pending = { display_name: name, phone, country, gender, birthdate: birthdate || null, agreed_terms_at: new Date().toISOString() };
    localStorage.setItem("pendingProfile", JSON.stringify(pending));
  } catch {}
  await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/account` } });
};
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 grid place-items-center">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-extrabold text-center mb-6 font-nastaliq">يا هلا بكم يا هلا بكم</h1>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="signup">تسجيل حساب</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4 grid gap-3">
              <Label className="text-right">البريد الإلكتروني *</Label>
              <Input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="text-right" />
              <Label className="text-right">كلمة المرور *</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e)=>setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="text-right pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
<Button className="w-full rounded-full" disabled={loading} onClick={signIn}>دخول</Button>
                <Button variant="secondary" className="w-full rounded-full flex items-center gap-2" onClick={signInGoogle}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  المتابعة بـ Google
                </Button>
            </TabsContent>
<TabsContent value="signup" className="mt-4 grid gap-3">
              <Label className="text-right">الاسم الكامل *</Label>
              <Input type="text" required value={name} onChange={(e)=>setName(e.target.value)} placeholder="اسمك الكامل" className="text-right" />
              <Label className="text-right">البريد الإلكتروني *</Label>
              <Input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="text-right" />
              <Label className="text-right">كلمة المرور *</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e)=>setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="text-right pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <Label className="text-right">الهاتف *</Label>
              <Input type="tel" required value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="05xxxxxxxx" className="text-right" />

              <Label className="text-right">البلد *</Label>
              <Select value={country} onValueChange={setCountry} required>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر البلد" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {countries.map((countryName) => (
                    <SelectItem key={countryName} value={countryName} className="text-right cursor-pointer">
                      {countryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid gap-2">
                <Label className="text-right">الجنس *</Label>
                <RadioGroup value={gender} onValueChange={(v)=>setGender(v as any)} className="flex items-center gap-4 justify-end" required>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Label htmlFor="g-female">أنثى</Label>
                    <RadioGroupItem id="g-female" value="female" />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Label htmlFor="g-male">ذكر</Label>
                    <RadioGroupItem id="g-male" value="male" />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Label htmlFor="g-other">أخرى</Label>
                    <RadioGroupItem id="g-other" value="other" />
                  </div>
                </RadioGroup>
              </div>

              <Label className="text-right">تاريخ الميلاد *</Label>
              <Input type="date" required value={birthdate} onChange={(e)=>setBirthdate(e.target.value)} className="text-right" />

              <label className="flex items-center gap-2 text-sm mt-1 justify-start">
                <Checkbox checked={agree} onCheckedChange={(v:any)=> setAgree(Boolean(v))} />
                <span dir="rtl">أوافق على <a href="/terms" className="underline story-link">شروط الاستخدام</a></span>
              </label>

              <Button className="w-full rounded-full" disabled={loading || !agree || !name.trim() || !email.trim() || !password || !phone.trim() || !country || !birthdate} onClick={signUp}>إنشاء حساب</Button>
              <Button variant="secondary" className="w-full rounded-full flex items-center gap-2" disabled={!agree} onClick={signUpGoogle}>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                التسجيل بـ Google
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
