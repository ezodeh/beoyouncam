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
import { getEventSettings, getSupportedCountries, detectCountryCode, getUserProfile } from "@/lib/eventSettings";
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
  const [tab, setTab] = useState<"phone" | "email">("email");
  const [country, setCountry] = useState("+962");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState<{ title?: string | null; description?: string | null; sign_in_method?: "phone" | "email" | null; cover_url?: string | null; start_at?: string | null; end_at?: string | null; show_header?: boolean; is_private?: boolean; password?: string | null } | null>(null);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  useEffect(() => {
    const title = eventDetails?.title || eventName;
    document.title = `الترحيب — ${title} — من عيونكم`;
  }, [eventName, eventDetails?.title]);
  const countries = useMemo(() => getSupportedCountries().map(c => ({
    code: c.code,
    label: c.nameAr
  })), []);
  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data: row, error } = await supabase
        .from("events")
        .select("title, description, sign_in_method, cover_url, start_at, end_at, show_header, is_private, password")
        .eq("token", token as string)
        .maybeSingle();
      const data: any = row;
      if (!error && data) {
        const row = data as any;
        // redirect based on timing if configured
        const now = new Date();
        if (row.start_at && now < new Date(row.start_at)) {
          const qs = new URLSearchParams(location.search);
          qs.set("start_at", row.start_at);
          navigate(`/event/${token}/soon?${qs.toString()}`);
          return;
        }
        if (row.end_at && now > new Date(row.end_at)) {
          const qs = new URLSearchParams(location.search);
          qs.set("end_at", row.end_at);
          navigate(`/event/${token}/ended?${qs.toString()}`);
          return;
        }
        setEventDetails({
          ...(row as any),
          sign_in_method: (row.sign_in_method as "phone" | "email" | null),
        });
        if (row.sign_in_method) setTab(row.sign_in_method as any);
        
        // Check if event is private and needs password
        if (row.is_private && row.password) {
          const hasAccess = sessionStorage.getItem(`event_access_${token}`);
          if (!hasAccess) {
            setShowPasswordInput(true);
          }
        }
      }
    })();
  }, [token]);
  const goToCamera = () => {
    const qs = location.search || "";
    navigate(`/event/${token}/camera${qs}`);
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast({
        title: "كلمة المرور مطلوبة",
        description: "يرجى إدخال كلمة المرور للوصول إلى المناسبة",
        variant: "destructive"
      });
      return;
    }

    if (eventDetails?.password === password.trim()) {
      sessionStorage.setItem(`event_access_${token}`, "granted");
      setShowPasswordInput(false);
      toast({
        title: "تم التحقق بنجاح"
      });
    } else {
      toast({
        title: "كلمة مرور خاطئة",
        description: "يرجى التحقق من كلمة المرور والمحاولة مرة أخرى",
        variant: "destructive"
      });
    }
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
      
      // Get current session to link participant with user if logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      const payload: any = {
        event_token: token,
        method,
        name: name.trim(),
        user_id: session?.user?.id || null // Add user_id if user is logged in
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
      localStorage.setItem(`participantName:${token}`, name.trim());
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
          redirectTo: window.location.href,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'openid email profile'
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
      
      if (session?.user) {
          // Auto-fill form with user data from Google/auth
        const userData = session.user;
        const fullName = userData.user_metadata?.full_name || userData.user_metadata?.name || "";
        const userEmail = userData.email || "";
        
        if (fullName) setName(fullName);
        if (userEmail) setEmail(userEmail);
        
        // Check if user already has profile data
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          
          if (profile) {
            if (profile.display_name) setName(profile.display_name);
            if (profile.phone) {
              // Extract country code and phone from profile
              const phoneMatch = profile.phone?.match(/^(\+\d{1,4})(.+)$/);
              if (phoneMatch) {
                setCountry(phoneMatch[1]);
                // Remove leading zeros from phone number
                const cleanPhone = phoneMatch[2].replace(/^0+/, '');
                // Set phone without country code
                const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
                if (phoneInput) {
                  phoneInput.value = cleanPhone;
                }
              }
            }
          }
        } catch (error) {
          console.log("Error fetching profile:", error);
        }
        
        // Check if user is already a participant first
        const { data: existingParticipant } = await supabase
          .from("participants")
          .select("*")
          .eq("event_token", token)
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        if (existingParticipant) {
          // User already registered, fill their data but don't auto-proceed
          localStorage.setItem(`participant:${token}`, "1");
          localStorage.setItem(`participantName:${token}`, existingParticipant.name || fullName || "مستخدم");
          // Fill the form but stay on welcome screen
          if (existingParticipant.name) setName(existingParticipant.name);
          if (existingParticipant.email) setEmail(existingParticipant.email);
          return;
        }
        
        // If user is not already registered, try to add them as participant
        try {
          const { error: insertError } = await supabase.from("participants").insert({
            event_token: token,
            method: "google",
            user_id: session.user.id,
            name: fullName || userData.user_metadata?.email?.split('@')[0] || "مستخدم",
            email: userEmail
          });
          
          if (!insertError) {
            localStorage.setItem(`participant:${token}`, "1");
            localStorage.setItem(`participantName:${token}`, fullName || "مستخدم");
            
            // Fill form but don't auto-proceed - let user see the welcome screen
            // User can manually click "ابدأ" when ready
          } else {
            console.log("Participant registration error:", insertError);
          }
        } catch (error) {
          console.error("Error adding participant:", error);
        }
        
        // Don't check local storage for auto-proceed - always show welcome screen
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      {eventDetails?.show_header !== false && (
        <>
          <Navbar compact fullBleed />
          <div className="brand-strip w-full" />
        </>
      )}
      <figure className="relative w-full mb-3 overflow-hidden bg-secondary rounded-none">
        <div className="relative h-[38vh] md:h-[48vh]">
          <img src={eventDetails?.cover_url || heroImage} alt={`صورة ${(eventDetails?.title || eventName)}`} className="absolute inset-0 h-full w-full object-cover kenburns-slow" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
          <Button variant="secondary" size="icon" className="absolute top-4 left-4 rounded-full bg-background/70 supports-[backdrop-filter]:bg-background/40 backdrop-blur shadow-elevated" onClick={handleShare} aria-label="مشاركة">
            <Share className="h-4 w-4" />
          </Button>
          <figcaption className="absolute inset-x-4 top-4 flex justify-center">
            
          </figcaption>
        </div>
      </figure>
      <main className="container mx-auto px-4 py-4 flex-1 grid place-items-center">
        <section className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="font-nastaliq text-4xl md:text-5xl leading-snug">{eventDetails?.title || eventName}</h1>
            <p className="mt-6 md:mt-7 text-muted-foreground">{eventDetails?.description?.trim() || "يا هلا بكم"}</p>
          </div>

          {/* Password Input for Private Events */}
          {showPasswordInput ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">مناسبة خاصة</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  يتطلب الوصول إلى هذه المناسبة كلمة مرور
                </p>
              </div>
              <div>
                <Label htmlFor="event-password">كلمة المرور</Label>
                <Input
                  id="event-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="text-right"
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                />
              </div>
              <Button 
                className="w-full rounded-full" 
                onClick={handlePasswordSubmit}
                disabled={!password.trim()}
              >
                التحقق من كلمة المرور
              </Button>
            </div>
          ) : (
            <>
              {/* Regular Event Registration Form */}
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
                      <SelectTrigger className="w-full"><span dir="ltr" className="tabular-nums">{country}</span></SelectTrigger>
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
          <div className="mt-3 text-center">
            <Button asChild variant="outline" className="rounded-full">
              <a href="/auth">تسجيل/إنشاء حساب بالبريد</a>
            </Button>
          </div>
            </>
          )}
        </section>
      </main>
      
      {eventDetails?.show_header !== false && (
        <Footer />
      )}
    </div>;
}