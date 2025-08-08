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

export default function EventWelcome() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const eventName = new URLSearchParams(location.search).get("title") || "مناسبتكم";

  const [tab, setTab] = useState<"phone"|"email">("phone");
  const [country, setCountry] = useState("+962");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = `الترحيب — ${eventName} — من عيونكم`;
  }, [eventName]);

  const countries = useMemo(() => [
    { code: "+962", label: "الأردن" },
    { code: "+966", label: "السعودية" },
    { code: "+971", label: "الإمارات" },
    { code: "+20", label: "مصر" },
    { code: "+964", label: "العراق" },
    { code: "+965", label: "الكويت" },
    { code: "+973", label: "البحرين" },
    { code: "+968", label: "عُمان" },
    { code: "+974", label: "قطر" },
    { code: "+961", label: "لبنان" },
  ], []);

  const goToCamera = () => {
    const qs = location.search || "";
    navigate(`/event/${token}/camera${qs}`);
  };

  async function submit() {
    try {
      setLoading(true);
      const method = tab === "phone" ? "phone" : "email";
      const payload: any = { event_token: token, method, name: name || null };
      if (method === "phone") { payload.country_code = country; payload.phone = phone.trim(); }
      else { payload.email = email.trim(); }

      const { error } = await supabase.from("participants").insert(payload);
      if (error) throw error;
      localStorage.setItem(`participant:${token}`, "1");
      toast({ title: "أهلًا وسهلًا!" });
      goToCamera();
    } catch (e: any) {
      toast({ title: "تعذّر التسجيل" });
    } finally { setLoading(false); }
  }

  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + `/event/${token}/welcome${location.search}` } });
    } catch (_) {}
  };

  useEffect(() => {
    // If already registered locally or logged in, allow proceeding
    const has = localStorage.getItem(`participant:${token}`);
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (has || session) {
        if (session) {
          try { await supabase.from("participants").insert({ event_token: token, method: "google", user_id: session.user.id }); } catch (_) {}
          localStorage.setItem(`participant:${token}`, "1");
        }
        goToCamera();
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Navbar compact fullBleed />
      <main className="container mx-auto px-4 py-8">
        <section className="max-w-md mx-auto">
          <header className="text-center mb-6">
            <h1 className="text-3xl font-nastaliq">{eventName}</h1>
            <p className="text-sm text-muted-foreground mt-1">مرحبًا! سجّل دخولك للمشاركة في الكاميرا</p>
          </header>

          <Tabs value={tab} onValueChange={(v)=>setTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="phone">الهاتف</TabsTrigger>
              <TabsTrigger value="email">الإيميل</TabsTrigger>
            </TabsList>
            <TabsContent value="phone" className="space-y-3">
              <div>
                <Label htmlFor="name">الاسم (اختياري)</Label>
                <Input id="name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="اسمك" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label>المقدمة</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="الدولة" /></SelectTrigger>
                    <SelectContent>
                      {countries.map((c)=> (
                        <SelectItem key={c.code} value={c.code}>{c.label} {c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="phone">الهاتف</Label>
                  <Input id="phone" inputMode="tel" dir="ltr" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="5XXXXXXX" />
                </div>
              </div>
              <Button className="w-full rounded-full" disabled={loading || phone.trim().length < 6} onClick={submit}>ابدأ</Button>
            </TabsContent>
            <TabsContent value="email" className="space-y-3">
              <div>
                <Label htmlFor="name2">الاسم (اختياري)</Label>
                <Input id="name2" value={name} onChange={(e)=>setName(e.target.value)} placeholder="اسمك" />
              </div>
              <div>
                <Label htmlFor="email">الإيميل</Label>
                <Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <Button className="w-full rounded-full" disabled={loading || !email.includes("@")} onClick={submit}>ابدأ</Button>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-2">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground">أو</span>
            <div className="h-px bg-border flex-1" />
          </div>
          <Button variant="secondary" className="w-full rounded-full" onClick={signInWithGoogle}>المتابعة بحساب Google</Button>
        </section>
      </main>
    </div>
  );
}
