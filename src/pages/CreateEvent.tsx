import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar as CalendarIcon, Upload, Crown, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";

// Album timing type

type AlbumTiming = "during" | "after12" | "after24" | "custom" | "manual";

function DateTimeField({
  label,
  value,
  onChange,
  required,
  error,
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date | null) => void;
  required?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  
  // Extract current time values
  const currentHour = value ? value.getHours().toString().padStart(2, '0') : '09';
  const currentMinute = value ? value.getMinutes().toString().padStart(2, '0') : '00';
  
  const handleTimeChange = (hour: string, minute: string) => {
    const base = value ?? new Date();
    const next = new Date(base);
    next.setHours(parseInt(hour, 10));
    next.setMinutes(parseInt(minute, 10));
    onChange(next);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).filter((_, i) => i % 5 === 0); // Every 5 minutes

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-right">
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between">
            <span>
              {value ? format(value, "dd/MM/yyyy HH:mm", { locale: ar }) : "اختر التاريخ والوقت"}
            </span>
            <CalendarIcon className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="p-3">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(d) => onChange(d ?? null)}
            initialFocus
            className="pointer-events-auto"
          />
          <div className="mt-3 flex items-center gap-2">
            {/* Mobile-friendly time picker */}
            <Drawer open={timePickerOpen} onOpenChange={setTimePickerOpen}>
              <DrawerHeader className="hidden" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setTimePickerOpen(true)}
                className="flex-1"
              >
                {currentHour}:{currentMinute}
              </Button>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>اختر الوقت</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">الساعة</Label>
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {hours.map((hour) => (
                          <Button
                            key={hour}
                            variant={currentHour === hour ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTimeChange(hour, currentMinute)}
                            className="text-sm"
                          >
                            {hour}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">الدقيقة</Label>
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {minutes.map((minute) => (
                          <Button
                            key={minute}
                            variant={currentMinute === minute ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTimeChange(currentHour, minute)}
                            className="text-sm"
                          >
                            {minute}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button className="w-full">تأكيد</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
              موافق
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Pill({ selected, children, onClick, disabled = false }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`rounded-full px-4 py-2 text-sm border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow hover-scale"
      } ${
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground border-border"
      }`}
    >
      {children}
    </button>
  );
}

export default function CreateEvent() {
  // SEO
  useEffect(() => {
    document.title = "إنشاء مناسبة — عيون cam";
    const desc = "أنشئ مناسبة وادعُ ضيوفك لمشاركة الصور والفيديو — سريع وسهل.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, []);

  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const totalSteps = 5;
  const stepTitles = [
    "مناسبة جديدة",
    "ألبوم الصور",
    "شاشة الألبوم",
    "إدارة المشاركين",
    "إتمام إنشاء المناسبة",
  ];

  // Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [endAt, setEndAt] = useState<Date | null>(null);
  const [calendarType, setCalendarType] = useState<"gregorian" | "hijri">("gregorian");

  // Step 2
  const [timing, setTiming] = useState<AlbumTiming>("manual");
  const [customPublishAt, setCustomPublishAt] = useState<Date | null>(null);
  const [privacy, setPrivacy] = useState<"public" | "private">("private");
  const [autoShareToGuests, setAutoShareToGuests] = useState(false);
  const [shareChannel, setShareChannel] = useState<"sms" | "email" | "none">("none");

  // Step 3
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [welcomeTitle, setWelcomeTitle] = useState("أهلاً وسهلاً في اليوم");
  const [welcomeBody, setWelcomeBody] = useState(
    "شكراً بمشاركتكم فرحتنا! صوروا بحب، ما بدنا فلتر مبالغ فيه 🙂."
  );
  const [ctaLabel, setCtaLabel] = useState("للتصوير");

  // Step 4
  const [guests, setGuests] = useState<number>(5);
  const guestOptions = [5, 7, 25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500];
  const [shotsPerGuest, setShotsPerGuest] = useState<number>(20);
  const shotsOptions = [5, 10, 15, 20, 25, 30];
  const [enableVideo, setEnableVideo] = useState(false);
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  type QuickEditKey = 'title' | 'startAt' | 'endAt' | 'privacy' | 'share' | 'guests' | 'shots' | 'video';
  const [quickEdit, setQuickEdit] = useState<QuickEditKey | null>(null);
  // تطبيق قاعدة 5 مشاركين
  useEffect(() => {
    if (guests === 5) {
      if (shotsPerGuest !== 10) setShotsPerGuest(10);
      if (enableVideo) setEnableVideo(false);
    }
  }, [guests]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // cover preview
  useEffect(() => {
    if (!coverFile) return setCoverPreview(null);
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  // Draft persistence
  useEffect(() => {
    const draft = localStorage.getItem("create_event_draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        setTitle(d.title ?? "");
        setDescription(d.description ?? "");
        setStartAt(d.startAt ? new Date(d.startAt) : null);
        setEndAt(d.endAt ? new Date(d.endAt) : null);
        setTiming(d.timing ?? "manual");
        setCustomPublishAt(d.customPublishAt ? new Date(d.customPublishAt) : null);
        setPrivacy(d.privacy ?? "private");
        setAutoShareToGuests(!!d.autoShareToGuests);
        setShareChannel(d.shareChannel ?? "none");
        setWelcomeTitle(d.welcomeTitle ?? "أهلاً وسهلاً في اليوم");
        setWelcomeBody(d.welcomeBody ?? "");
        setCtaLabel(d.ctaLabel ?? "للتصوير");
        setGuests(d.guests ?? 100);
        setShotsPerGuest(d.shotsPerGuest ?? 20);
        setEnableVideo(!!d.enableVideo);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const draft = {
      title,
      description,
      startAt,
      endAt,
      timing,
      customPublishAt,
      privacy,
      autoShareToGuests,
      shareChannel,
      welcomeTitle,
      welcomeBody,
      ctaLabel,
      guests,
      shotsPerGuest,
      enableVideo,
    };
    localStorage.setItem("create_event_draft", JSON.stringify(draft));
  }, [title, description, startAt, endAt, timing, customPublishAt, privacy, autoShareToGuests, shareChannel, welcomeTitle, welcomeBody, ctaLabel, guests, shotsPerGuest, enableVideo]);

  // auth session
  useEffect(() => {
    let unsub: { unsubscribe: () => void } | null = null;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user.id || null);
      if (!session?.user?.id) {
        alert("Sign in first. You cannot make an event without signing in.");
        navigate("/auth");
        return;
      }
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id || null));
      unsub = subscription;
    })();
    return () => { try { unsub?.unsubscribe(); } catch {} };
  }, []);

  // price estimation
  const price = useMemo(() => {
    let base = 120; // قاعدة بسيطة
    base += Math.ceil(Math.max(guests, 1) / 50) * 90;
    base += Math.ceil(Math.max(shotsPerGuest, 1) / 10) * 40;
    if (enableVideo) base += 150;
    if (autoShareToGuests && shareChannel !== "none") base += Math.round(0.18 * guests);
    return base;
  }, [guests, shotsPerGuest, enableVideo, autoShareToGuests, shareChannel]);

  // validation
  function validate(currentStep = step) {
    const e: Record<string, string> = {};
    if (currentStep === 1) {
      if (!title.trim()) e.title = "الاسم مطلوب";
      if (!startAt) e.startAt = "مطلوب";
      if (!endAt) e.endAt = "مطلوب";
      if (startAt && endAt && startAt >= endAt) e.endAt = "يجب أن يكون بعد وقت البداية";
    }
    if (currentStep === 2) {
      if (timing === "custom" && !customPublishAt) e.customPublishAt = "حدد وقت النشر";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const canNext = useMemo(() => validate(step), [step, title, startAt, endAt, timing, customPublishAt]);

  function next() {
    if (!validate(step)) return;
    setStep((s) => Math.min(s + 1, totalSteps));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function submit() {
    if (!validate(1) || !validate(2) || !validate(3) || !validate(4)) {
      setStep(1);
      return;
    }
    if (!userId) {
      toast({ title: "يرجى تسجيل الدخول", description: "سجّل الدخول أو أنشئ حسابًا للمتابعة" });
      return navigate("/auth");
    }
    if (!termsAccepted) {
      toast({ title: "الرجاء الموافقة على الشروط", description: "لا يمكن المتابعة دون الموافقة" });
      return;
    }
    setSubmitting(true);
    try {
      const token = Math.random().toString(36).slice(2, 10);
      let coverUrl: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop() || "jpg";
        const path = `covers/${token}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("event-media").upload(path, coverFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: coverFile.type,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("event-media").getPublicUrl(path);
        coverUrl = pub.publicUrl;
      }

      const isPrivate = privacy === "private";
      const publicationAt = (() => {
        if (timing === "during") return startAt ? startAt.toISOString() : null;
        if (timing === "after12") return startAt ? new Date(startAt.getTime() + 12 * 3600 * 1000).toISOString() : null;
        if (timing === "after24") return startAt ? new Date(startAt.getTime() + 24 * 3600 * 1000).toISOString() : null;
        if (timing === "custom") return customPublishAt ? customPublishAt.toISOString() : null;
        return null; // manual
      })();
      const organizerCountry = (() => {
        try {
          const lang = navigator.language || "";
          if (lang.includes("MA")) return "+212";
          if (lang.includes("DZ")) return "+213";
          if (lang.includes("LY")) return "+218";
          if (lang.includes("TN")) return "+216";
          if (lang.includes("EG")) return "+20";
          if (lang.includes("SD")) return "+249";
          if (lang.includes("YE")) return "+967";
          if (lang.includes("SY")) return "+963";
          if (lang.includes("PS")) return "+970";
          if (lang.includes("LB")) return "+961";
          if (lang.includes("JO")) return "+962";
          if (lang.includes("SA")) return "+966";
          if (lang.includes("AE")) return "+971";
          if (lang.includes("QA")) return "+974";
          if (lang.includes("BH")) return "+973";
          if (lang.includes("OM")) return "+968";
          if (lang.includes("KW")) return "+965";
          if (lang.includes("IQ")) return "+964";
          return "+962";
        } catch { return "+962"; }
      })();

      const { error: insErr } = await supabase.from("events").insert({
        token,
        title: title.trim(),
        description: description.trim() || null,
        sign_in_method: "phone",
        start_at: startAt ? startAt.toISOString() : null,
        end_at: endAt ? endAt.toISOString() : null,
        cover_url: coverUrl,
        max_shots: shotsPerGuest,
        owner_id: userId,
        is_private: isPrivate,
        published_at: publicationAt,
        country_code: organizerCountry,
        calendar_type: calendarType,
      });
      if (insErr) throw insErr;

      localStorage.removeItem("create_event_draft");
      toast({ title: "تم إنشاء المناسبة" });
      navigate(`/manage/${token}`);
    } catch (err: any) {
      toast({ title: "حدث خطأ غير متوقع", description: err?.message || "" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-almarai">
      <Navbar />
      <main className="flex-1 container mx-auto py-10">
        <div dir="rtl" className="mx-auto max-w-2xl px-4">
          <header className="mb-6">
            <h1 className="text-3xl font-medium font-nastaliq">إنشاء مناسبة</h1>
            <p className="text-sm text-muted-foreground mt-1">ابدأ بتعريف المناسبة، ثم اضبط الألبوم والمشاركين وخيارات العرض.</p>
            <link rel="canonical" href={window.location.origin + "/create-event"} />
          </header>

          {/* Stepper (clickable) */}
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={`flex-1 flex items-center ${s < 5 ? "mr-2" : ""} group focus:outline-none`}
                aria-label={`الانتقال إلى خطوة ${s}: ${stepTitles[s - 1]}`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 grid place-items-center rounded-full border transition-colors ${
                      s <= step ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-secondary"
                    }`}
                  >
                    {s}
                  </div>
                  <span className={`mt-1 text-[10px] ${s <= step ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                    {stepTitles[s - 1]}
                  </span>
                </div>
                {s < 5 && (
                  <div className={`h-px flex-1 mx-2 ${s < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </button>
            ))}
          </div>

          <Card className="shadow-elevated bg-card/70 backdrop-blur-md supports-[backdrop-filter]:bg-card/60 border border-border/70">
            <CardHeader>
              <CardTitle className="text-2xl font-nastaliq font-medium">{stepTitles[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              {step === 1 && (
                <div className="grid gap-4 animate-in fade-in-0 duration-200">
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label>
                        اسم المناسبة<span className="text-destructive"> *</span>
                      </Label>
                      {errors.title && (
                        <span className="text-xs text-destructive">{errors.title}</span>
                      )}
                    </div>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="فرحة أماني وممدوح"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>وصف المناسبة</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="نبذة تظهر للضيوف"
                    />
                  </div>
                  <DateTimeField
                    label="وقت بدء المناسبة"
                    value={startAt}
                    onChange={setStartAt}
                    required
                    error={errors.startAt}
                  />
                  <DateTimeField
                    label="وقت انتهاء المناسبة"
                    value={endAt}
                    onChange={setEndAt}
                    required
                    error={errors.endAt}
                  />
                  
                  {/* خيار التقويم */}
                  <div className="grid gap-2">
                    <Label>نوع التقويم</Label>
                    <div className="flex gap-2">
                      <Pill 
                        selected={calendarType === "gregorian"} 
                        onClick={() => setCalendarType("gregorian")}
                      >
                        ميلادي
                      </Pill>
                      <Pill 
                        selected={calendarType === "hijri"} 
                        onClick={() => setCalendarType("hijri")}
                      >
                        هجري
                      </Pill>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-5 animate-in fade-in-0 duration-200">
                  <div className="grid gap-2">
                    <Label>موعد عرض الألبوم</Label>
                    <div className="flex flex-wrap gap-2">
                      <Pill selected={timing === "during"} onClick={() => setTiming("during")}>
                        خلال الحدث
                      </Pill>
                      <Pill selected={timing === "after12"} onClick={() => setTiming("after12")}>
                        بعد 12 ساعة
                      </Pill>
                      <Pill selected={timing === "after24"} onClick={() => setTiming("after24")}>
                        بعد 24 ساعة
                      </Pill>
                      <Pill selected={timing === "custom"} onClick={() => setTiming("custom")}>
                        مخصص
                      </Pill>
                      <Pill selected={timing === "manual"} onClick={() => setTiming("manual")}>
                        ننشر يدويًا
                      </Pill>
                    </div>
                  </div>

                  {timing === "custom" && (
                    <DateTimeField
                      label="وقت النشر المخصص"
                      value={customPublishAt}
                      onChange={setCustomPublishAt}
                      required
                      error={errors.customPublishAt}
                    />
                  )}

                  <div className="grid gap-2">
                    <Label>حالة الألبوم</Label>
                    <div className="flex gap-2">
                      <Pill selected={privacy === "private"} onClick={() => setPrivacy("private")}>
                        خاص
                      </Pill>
                      <Pill selected={privacy === "public"} onClick={() => setPrivacy("public")}>
                        عام
                      </Pill>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>مشاركة الألبوم للحضور تلقائيًا</Label>
                    <Switch checked={autoShareToGuests} onCheckedChange={setAutoShareToGuests} />
                  </div>

                  <div className="grid gap-2">
                    <Label>مشاركة الألبوم عبر</Label>
                    <div className="flex gap-2">
                      <Pill
                        selected={shareChannel === "sms"}
                        onClick={() => setShareChannel("sms")}
                        disabled={!autoShareToGuests}
                      >
                        SMS
                      </Pill>
                      <Pill
                        selected={shareChannel === "email"}
                        onClick={() => setShareChannel("email")}
                        disabled={!autoShareToGuests}
                      >
                        Email
                      </Pill>
                      <Pill
                        selected={shareChannel === "none"}
                        onClick={() => setShareChannel("none")}
                        disabled={!autoShareToGuests}
                      >
                        لاحقًا
                      </Pill>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-4 animate-in fade-in-0 duration-200">
                  <div className="grid gap-2">
                    <Label>صورة الغلاف</Label>
                    <label className="border border-dashed border-border rounded-xl p-0 overflow-hidden cursor-pointer">
                      <div className="aspect-video grid place-items-center">
                        {coverPreview ? (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <img src={coverPreview} alt="صورة الغلاف" className="w-full h-full object-cover" />
                        ) : (
                          <div className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
                            <Upload className="h-5 w-5" />
                            <span>ارفع صورة للغلاف</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <div className="grid gap-2">
                    <Label>عنوان ترحيبي</Label>
                    <Input value={welcomeTitle} onChange={(e) => setWelcomeTitle(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>نص ترحيبي</Label>
                    <Textarea value={welcomeBody} onChange={(e) => setWelcomeBody(e.target.value)} rows={3} />
                  </div>
                  <div className="grid gap-2">
                    <Label>نص زر الدعوة</Label>
                    <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="grid gap-5 animate-in fade-in-0 duration-200">
                  <div className="grid gap-2">
                    <Label>عدد الحضور</Label>
                    <div className="flex flex-wrap gap-2">
                      {guestOptions.map((g) => (
                        <Pill key={g} selected={guests === g} onClick={() => setGuests(g)}>
                          {g}
                        </Pill>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>عدد اللقطات لكل ضيف</Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {[5, 10, 15, 20, 25, 30].map((s) => (
                        <Pill key={s} selected={shotsPerGuest === s} onClick={() => setShotsPerGuest(s)}>
                          {s}
                        </Pill>
                      ))}
                      <Pill selected={shotsPerGuest === 999} onClick={() => setShotsPerGuest(999)}>
                        بلا حدود <Crown className="inline-block h-4 w-4 ml-1" />
                      </Pill>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>السماح بالمقاطع فيديو (10s)</Label>
                    <Switch checked={enableVideo} onCheckedChange={setEnableVideo} />
                  </div>
                  {guests === 5 && (
                    <div className="rounded-md bg-accent/30 border border-border p-3 text-sm">
                      تم تفعيل باقة 5 مشاركين: 10 لقطات لكل شخص مجانًا (بدون فيديو). الإيميل مجاني، والواتساب غير مجاني.
                    </div>
                  )}
                  <div className="rounded-xl bg-muted border border-border p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span>السعر التقديري</span>
                      <span className="text-xl font-bold">₪ {price}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">سعر تقريبي—يتغير حسب الخطة والإضافات.</p>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="grid gap-4">
                  {!userId && (
                    <div className="rounded-xl border border-border p-4 bg-card">
                      <div className="text-sm mb-2">قبل الإنهاء: سجّل الدخول بحسابك.</div>
                      <Button
                        onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/create-event" } })}
                        className="rounded-full"
                      >
                        تسجيل الدخول بحساب Google
                      </Button>
                    </div>
                  )}
                  <div className="rounded-xl bg-accent/30 border border-border p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div onClick={() => setQuickEdit('title')} className="cursor-pointer rounded-md p-2 -m-2 hover:bg-accent/40 transition">
                        <div className="text-muted-foreground">اسم المناسبة</div>
                        <div className="font-semibold">{title || "—"}</div>
                      </div>
                      <div onClick={() => setQuickEdit('startAt')} className="cursor-pointer rounded-md p-2 -m-2 hover:bg-accent/40 transition">
                        <div className="text-muted-foreground">تاريخ البداية</div>
                        <div className="font-semibold">
                          {startAt ? format(startAt, "dd/MM/yyyy HH:mm", { locale: ar }) : "—"}
                        </div>
                      </div>
                      <div onClick={() => setQuickEdit('endAt')} className="cursor-pointer rounded-md p-2 -m-2 hover:bg-accent/40 transition">
                        <div className="text-muted-foreground">تاريخ الانتهاء</div>
                        <div className="font-semibold">
                          {endAt ? format(endAt, "dd/MM/yyyy HH:mm", { locale: ar }) : "—"}
                        </div>
                      </div>
                      <div onClick={() => setQuickEdit('privacy')} className="cursor-pointer rounded-md p-2 -m-2 hover:bg-accent/40 transition">
                        <div className="text-muted-foreground">حالة الألبوم</div>
                        <div className="font-semibold">{privacy === "public" ? "عام" : "خاص"}</div>
                      </div>
                      <div onClick={() => setQuickEdit('share')} className="cursor-pointer rounded-md p-2 -m-2 hover:bg-accent/40 transition">
                        <div className="text-muted-foreground">مشاركة تلقائية</div>
                        <div className="font-semibold">
                          {autoShareToGuests
                            ? shareChannel === "sms"
                              ? "SMS"
                              : shareChannel === "email"
                              ? "Email"
                              : "—"
                            : "لا"}
                        </div>
                      </div>
                      <div onClick={() => setQuickEdit('guests')} className="cursor-pointer rounded-md p-2 -m-2 hover:bg-accent/40 transition">
                        <div className="text-muted-foreground">عدد الحضور</div>
                        <div className="font-semibold">{guests}</div>
                      </div>
                      <div onClick={() => setQuickEdit('shots')} className="cursor-pointer rounded-md p-2 -m-2 hover:bg-accent/40 transition">
                        <div className="text-muted-foreground">لقطات/ضيف</div>
                        <div className="font-semibold">{shotsPerGuest === 999 ? "بلا حدود" : shotsPerGuest}</div>
                      </div>
                      <div onClick={() => setQuickEdit('video')} className="cursor-pointer rounded-md p-2 -m-2 hover:bg-accent/40 transition">
                        <div className="text-muted-foreground">فيديو</div>
                        <div className="font-semibold">{enableVideo ? "مفعل" : "غير مفعل"}</div>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={termsAccepted} onCheckedChange={(v:any)=> setTermsAccepted(Boolean(v))} />
                    <span>
                      أوافق على <a href="/terms" className="underline story-link">شروط الاستخدام</a>
                    </span>
                  </label>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">الإجمالي التقديري</div>
                    <div className="text-2xl font-bold">₪ {price}</div>
                  </div>
                  <Button variant="hero" size="lg" onClick={submit} disabled={submitting || !termsAccepted || !userId} className="rounded-full">
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> جاري الإنشاء…
                      </span>
                    ) : (
                      "إنشاء المناسبة"
                    )}
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={prev} disabled={step === 1}>
                  <ChevronRight className="ml-1 h-4 w-4" />السابق
                </Button>
                {step < totalSteps ? (
                  <Button variant="hero" onClick={next} disabled={!canNext} className="rounded-full">
                    التالي<ChevronLeft className="mr-1 h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
          <Drawer open={!!quickEdit} onOpenChange={(o) => { if (!o) setQuickEdit(null); }}>
            <DrawerContent className="p-4">
              <DrawerHeader>
                <DrawerTitle>تعديل سريع</DrawerTitle>
              </DrawerHeader>
              <div className="grid gap-4" dir="rtl">
                {quickEdit === 'title' && (
                  <div className="grid gap-2">
                    <Label>اسم المناسبة</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                )}
                {quickEdit === 'startAt' && (
                  <DateTimeField label="وقت بدء المناسبة" value={startAt} onChange={setStartAt} required />
                )}
                {quickEdit === 'endAt' && (
                  <DateTimeField label="وقت انتهاء المناسبة" value={endAt} onChange={setEndAt} required />
                )}
                {quickEdit === 'privacy' && (
                  <div className="grid gap-2">
                    <Label>حالة الألبوم</Label>
                    <div className="flex gap-2">
                      <Pill selected={privacy === 'private'} onClick={() => setPrivacy('private')}>خاص</Pill>
                      <Pill selected={privacy === 'public'} onClick={() => setPrivacy('public')}>عام</Pill>
                    </div>
                  </div>
                )}
                {quickEdit === 'share' && (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>مشاركة الألبوم للحضور تلقائيًا</Label>
                      <Switch checked={autoShareToGuests} onCheckedChange={setAutoShareToGuests} />
                    </div>
                    <div className="flex gap-2">
                      <Pill selected={shareChannel === 'sms'} onClick={() => setShareChannel('sms')} disabled={!autoShareToGuests}>SMS</Pill>
                      <Pill selected={shareChannel === 'email'} onClick={() => setShareChannel('email')} disabled={!autoShareToGuests}>Email</Pill>
                      <Pill selected={shareChannel === 'none'} onClick={() => setShareChannel('none')} disabled={!autoShareToGuests}>لاحقًا</Pill>
                    </div>
                  </div>
                )}
                {quickEdit === 'guests' && (
                  <div className="grid gap-2">
                    <Label>عدد الحضور</Label>
                    <div className="flex flex-wrap gap-2">
                      {guestOptions.map((g) => (
                        <Pill key={g} selected={guests === g} onClick={() => setGuests(g)}>{g}</Pill>
                      ))}
                    </div>
                  </div>
                )}
                {quickEdit === 'shots' && (
                  <div className="grid gap-2">
                    <Label>عدد اللقطات لكل ضيف</Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {shotsOptions.map((s) => (
                        <Pill key={s} selected={shotsPerGuest === s} onClick={() => setShotsPerGuest(s)}>{s}</Pill>
                      ))}
                      <Pill selected={shotsPerGuest === 999} onClick={() => setShotsPerGuest(999)}>بلا حدود <Crown className="inline-block h-4 w-4 ml-1" /></Pill>
                    </div>
                  </div>
                )}
                {quickEdit === 'video' && (
                  <div className="flex items-center justify-between">
                    <Label>السماح بالمقاطع فيديو (10s)</Label>
                    <Switch checked={enableVideo} onCheckedChange={setEnableVideo} />
                  </div>
                )}
              </div>
              <DrawerFooter>
                <Button className="rounded-full" onClick={() => setQuickEdit(null)}>تم</Button>
                <DrawerClose />
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </main>
      <Footer />
    </div>
  );
}
