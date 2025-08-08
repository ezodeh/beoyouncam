import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-mnaoyonkom.jpg";
import Footer from "@/components/layout/Footer";
import { Share } from "lucide-react";
export default function EventWelcome() {
  const {
    token
  } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const eventName = new URLSearchParams(location.search).get("title") || "مناسبتكم";
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [country, setCountry] = useState("+962");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState<{ title?: string | null; description?: string | null; sign_in_method?: "phone" | "email" | null; cover_url?: string | null } | null>(null);
  useEffect(() => {
    const title = eventDetails?.title || eventName;
    document.title = `الترحيب — ${title} — من عيونكم`;
  }, [eventName, eventDetails?.title]);
  const countries = useMemo(() => [{
    code: "+972",
    label: "مناطق الـ48"
  }, {
    code: "+962",
    label: "الأردن"
  }, {
    code: "+966",
    label: "السعودية"
  }, {
    code: "+971",
    label: "الإمارات"
  }, {
    code: "+20",
    label: "مصر"
  }, {
    code: "+964",
    label: "العراق"
  }, {
    code: "+965",
    label: "الكويت"
  }, {
    code: "+973",
    label: "البحرين"
  }, {
    code: "+968",
    label: "عُمان"
  }, {
    code: "+974",
    label: "قطر"
  }, {
    code: "+961",
    label: "لبنان"
  }], []);
  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error } = await supabase
        .from("events")
        .select("title, description, sign_in_method, cover_url")
        .eq("token", token as string)
        .maybeSingle();
      if (!error && data) {
        setEventDetails({
          ...data,
          sign_in_method: (data.sign_in_method as "phone" | "email" | null),
        });
        if (data.sign_in_method) setTab(data.sign_in_method as any);
      }
    })();
  }, [token]);
  const goToCamera = () => {
    const qs = location.search || "";
    navigate(`/event/${token}/camera${qs}`);
  };
  async function submit() {
    if (!name.trim()) {
      toast({
        title: "الاسم مطلوب",
        description: "يرجى كتابة اسمك للمتابعة."
      });
      return;
    }
    try {
      setLoading(true);
      const method = tab === "phone" ? "phone" : "email";
      const payload: any = {
        event_token: token,
        method,
        name: name.trim()
      };
      if (method === "phone") {
        payload.country_code = country;
        payload.phone = phone.trim();
      } else {
        payload.email = email.trim();
      }
      const {
        error
      } = await supabase.from("participants").insert(payload);
      if (error) throw error;
      localStorage.setItem(`participant:${token}`, "1");
      toast({
        title: "أهلًا وسهلًا!"
      });
      goToCamera();
    } catch (e: any) {
      toast({
        title: "تعذّر التسجيل"
      });
    } finally {
      setLoading(false);
    }
  }
  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + `/event/${token}/welcome${location.search}`
        }
      });
    } catch (_) {}
  };
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "تم نسخ الرابط للمشاركة"
        });
      }
    } catch (_) {}
  };
  useEffect(() => {
    // If already registered locally or logged in, allow proceeding
    const has = localStorage.getItem(`participant:${token}`);
    (async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (has || session) {
        if (session) {
          try {
            await supabase.from("participants").insert({
              event_token: token,
              method: "google",
              user_id: session.user.id
            });
          } catch (_) {}
          localStorage.setItem(`participant:${token}`, "1");
        }
        goToCamera();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Navbar compact fullBleed />
      <div className="brand-strip w-full" />
      <figure className="relative w-full mb-3 overflow-hidden bg-secondary rounded-none">
        <div className="relative h-[78vh] md:h-[50vh]">
          <img src={eventDetails?.cover_url || heroImage} alt={`صورة ${(eventDetails?.title || eventName)}`} className="absolute inset-0 h-full w-full object-cover kenburns-slow" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
          <Button variant="secondary" size="icon" className="absolute top-4 left-4 rounded-full bg-background/70 supports-[backdrop-filter]:bg-background/40 backdrop-blur shadow-elevated" onClick={handleShare} aria-label="مشاركة">
            <Share className="h-4 w-4" />
          </Button>
          <figcaption className="absolute inset-x-4 top-4 flex justify-center">
            
          </figcaption>
        </div>
      </figure>
      <main className="container mx-auto px-4 py-4">
        <section className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="font-nastaliq text-4xl md:text-5xl leading-snug">مناسبتكم</h1>
            {eventDetails?.description && (
              <p className="mt-3 text-muted-foreground">{eventDetails.description}</p>
            )}
          </div>
          <Tabs value={tab} onValueChange={v => setTab(v as any)} className="w-full">
            {(eventDetails?.sign_in_method ?? tab) === "phone" && (
              <TabsContent value="phone" className="space-y-3" forceMount>
                <div>
                  <Label htmlFor="name" className="block mb-2.5 text-right">الاسم</Label>
                  <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="اسمك" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <Label className="block mb-2.5 text-right">المقدمة</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="الدولة" /></SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground shadow-elevated z-50">
                        {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.label} {c.code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="phone" className="block mb-2.5 text-right">الهاتف</Label>
                    <Input id="phone" inputMode="tel" dir="ltr" value={phone} onChange={e => setPhone(e.target.value)} placeholder="5XXXXXXX" />
                  </div>
                </div>
                <Button className="w-full rounded-full" disabled={loading || name.trim().length === 0 || phone.trim().length < 6} onClick={submit}>ابدأ</Button>
              </TabsContent>
            )}
            {(eventDetails?.sign_in_method ?? tab) === "email" && (
              <TabsContent value="email" className="space-y-3" forceMount>
                <div>
                  <Label htmlFor="name2" className="block mb-2.5 text-right">الاسم</Label>
                  <Input id="name2" required value={name} onChange={e => setName(e.target.value)} placeholder="اسمك" />
                </div>
                <div>
                  <Label htmlFor="email" className="block mb-2.5 text-right">الإيميل</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <Button className="w-full rounded-full" disabled={loading || name.trim().length === 0 || !email.includes("@")} onClick={submit}>ابدأ</Button>
              </TabsContent>
            )}
          </Tabs>

          <div className="my-4 flex items-center gap-2">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground">أو</span>
            <div className="h-px bg-border flex-1" />
          </div>
          <Button variant="secondary" className="w-full rounded-full" onClick={signInWithGoogle}>المتابعة بحساب Google</Button>
        </section>
      </main>
      
      <Footer />
    </div>;
}