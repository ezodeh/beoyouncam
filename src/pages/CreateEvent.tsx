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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar as CalendarIcon, Upload, Crown, ChevronRight, ChevronLeft, Loader2, Eye, Smartphone, Heart, Images, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { detectCountryCode, getSupportedCountries } from "@/lib/eventSettings";
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
    "معلومات المناسبة",
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

  // Step 3 - Simplified
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(true);

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
        setShowHeader(d.showHeader !== false);
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
      showHeader,
      guests,
      shotsPerGuest,
      enableVideo,
    };
    localStorage.setItem("create_event_draft", JSON.stringify(draft));
  }, [title, description, startAt, endAt, timing, customPublishAt, privacy, autoShareToGuests, shareChannel, showHeader, guests, shotsPerGuest, enableVideo]);

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
    // باقة 5 مشاركين مجانية: 10 لقطات لكل شخص (بدون فيديو)
    if (guests === 5 && shotsPerGuest === 10 && !enableVideo) {
      // الإيميل مجاني، والواتساب غير مجاني
      if (autoShareToGuests && shareChannel === "sms") {
        return Math.round(0.18 * guests); // تكلفة الواتساب فقط
      }
      return 0; // مجاني تماماً
    }
    
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

      const { data: event, error } = await supabase
        .from("events")
        .insert({
          event_title: title,
          album_description: description,
          cover_url: coverUrl,
          start_at: startAt?.toISOString(),
          end_at: endAt?.toISOString(),
          is_private: isPrivate,
          max_guests: guests,
          max_photos_per_guest: shotsPerGuest,
          allow_videos: enableVideo,
          auto_share_album: autoShareToGuests,
          share_method: shareChannel,
          album_publish_time: publicationAt,
          token,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      localStorage.removeItem("create_event_draft");
      
      toast({
        title: "تم إنشاء المناسبة بنجاح!",
        description: "يمكنك الآن إدارة مناسبتك من لوحة التحكم.",
      });

      navigate(`/admin-dashboard?event=${event.token}`);
    } catch (err: any) {
      console.error("Error creating event:", err);
      toast({
        title: "خطأ في إنشاء المناسبة",
        description: err.message || "حدث خطأ غير متوقع. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{stepTitles[step - 1]}</h1>
              <span className="text-sm text-muted-foreground">
                {step} من {totalSteps}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="min-h-[60vh]">
            <Card>
              <CardContent className="p-6">
                {/* Step 1: Event Info */}
                {step === 1 && (
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-right">
                        اسم المناسبة <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="أدخل اسم المناسبة"
                        className={errors.title ? "border-destructive" : ""}
                      />
                      {errors.title && <p className="text-destructive text-sm mt-1">{errors.title}</p>}
                    </div>

                    <div>
                      <Label className="text-right">وصف المناسبة</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="وصف قصير عن المناسبة"
                        rows={3}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <DateTimeField
                        label="وقت البداية"
                        value={startAt}
                        onChange={setStartAt}
                        required
                        error={errors.startAt}
                      />
                      <DateTimeField
                        label="وقت النهاية"
                        value={endAt}
                        onChange={setEndAt}
                        required
                        error={errors.endAt}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Album Settings */}
                {step === 2 && (
                  <div className="grid gap-4">
                    <div>
                      <Label>متى تريد نشر الألبوم؟</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        <Pill selected={timing === "manual"} onClick={() => setTiming("manual")}>
                          يدوياً
                        </Pill>
                        <Pill selected={timing === "during"} onClick={() => setTiming("during")}>
                          أثناء المناسبة
                        </Pill>
                        <Pill selected={timing === "after12"} onClick={() => setTiming("after12")}>
                          بعد 12 ساعة
                        </Pill>
                        <Pill selected={timing === "after24"} onClick={() => setTiming("after24")}>
                          بعد 24 ساعة
                        </Pill>
                        <Pill selected={timing === "custom"} onClick={() => setTiming("custom")}>
                          وقت مخصص
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

                    <div>
                      <Label>خصوصية الألبوم</Label>
                      <div className="flex gap-2 mt-2">
                        <Pill selected={privacy === "private"} onClick={() => setPrivacy("private")}>
                          خاص (رابط فقط)
                        </Pill>
                        <Pill selected={privacy === "public"} onClick={() => setPrivacy("public")}>
                          عام (يظهر للجميع)
                        </Pill>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>مشاركة الألبوم تلقائياً مع الضيوف</Label>
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

                {/* Step 3: Simple Event Setup */}
                {step === 3 && (
                  <div className="max-w-4xl mx-auto">
                    <div className="grid lg:grid-cols-5 gap-8">
                      {/* Panel اليمين: معاينة الهاتف */}
                      <div className="lg:col-span-2 flex flex-col items-center gap-4">
                        <Tabs defaultValue="welcome" className="w-full max-w-xs">
                          <TabsList className="grid w-full grid-cols-3 text-xs">
                            <TabsTrigger value="welcome" className="text-xs">الترحيب</TabsTrigger>
                            <TabsTrigger value="album-intro" className="text-xs">مقدمة الألبوم</TabsTrigger>
                            <TabsTrigger value="album" className="text-xs">الألبوم</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="welcome">
                            <div className="relative w-full h-[500px] bg-background border-8 border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-slate-800 rounded-b-lg"></div>
                              <div className="h-full overflow-y-auto">
                                <div className="min-h-full bg-background text-foreground flex flex-col" dir="rtl">
                                  {/* هيدر شرطي */}
                                  {showHeader && (
                                    <>
                                      <nav className="w-full bg-background border-b px-2 py-1">
                                        <div className="flex items-center justify-between">
                                          <img src="/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png" alt="عيون cam" className="h-3 w-auto" />
                                          <div className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-center">دخول</div>
                                        </div>
                                      </nav>
                                      <div className="brand-strip w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                                    </>
                                  )}
                                  
                                  {/* صورة الغلاف */}
                                  <figure className="relative w-full mb-1 overflow-hidden bg-secondary rounded-none">
                                    <div className="relative h-20">
                                      {coverPreview ? (
                                        <img 
                                          src={coverPreview} 
                                          alt="صورة الغلاف" 
                                          className="absolute inset-0 h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="absolute inset-0 bg-muted" />
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
                                    </div>
                                  </figure>
                                  
                                  {/* المحتوى الرئيسي */}
                                  <main className="px-3 py-2 flex-1 grid place-items-center">
                                    <section className="max-w-full mx-auto">
                                      <div className="text-center mb-4">
                                        <h1 className="font-nastaliq text-sm leading-snug font-bold">
                                          {title || "عنوان الحدث"}
                                        </h1>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                          {description || "يا هلا بكم"}
                                        </p>
                                      </div>
                                      
                                      {/* نموذج التسجيل */}
                                      <div className="w-full space-y-2">
                                        <div>
                                          <div className="text-xs mb-1 text-right text-muted-foreground">الاسم</div>
                                          <div className="h-6 bg-muted border rounded text-xs flex items-center px-2">اسمك</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          <div className="col-span-1">
                                            <div className="text-xs mb-1 text-right text-muted-foreground">المقدمة</div>
                                            <div className="h-6 bg-muted border rounded text-xs flex items-center justify-center">+970</div>
                                          </div>
                                          <div className="col-span-2">
                                            <div className="text-xs mb-1 text-right text-muted-foreground">الهاتف</div>
                                            <div className="h-6 bg-muted border rounded text-xs flex items-center px-2" dir="ltr">5XXXXXXX</div>
                                          </div>
                                        </div>
                                        <button className="w-full h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium mt-2">
                                          للتصوير
                                        </button>
                                      </div>
                                      
                                      {/* خط الفاصل */}
                                      <div className="my-3 flex items-center gap-2">
                                        <div className="h-px bg-border flex-1" />
                                        <span className="text-xs text-muted-foreground">أو</span>
                                        <div className="h-px bg-border flex-1" />
                                      </div>
                                      
                                      {/* زر Google */}
                                      <div className="w-full h-5 bg-muted rounded text-xs flex items-center justify-center">التسجيل بـ Google</div>
                                    </section>
                                  </main>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="album-intro">
                            <div className="relative w-full h-[500px] bg-background border-8 border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-slate-800 rounded-b-lg"></div>
                              <div className="h-full overflow-y-auto">
                                <div className="min-h-full bg-background text-foreground flex flex-col" dir="rtl">
                                  {/* هيدر شرطي */}
                                  {showHeader && (
                                    <>
                                      <nav className="w-full bg-background border-b px-2 py-1">
                                        <div className="flex items-center justify-between">
                                          <img src="/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png" alt="عيون cam" className="h-3 w-auto" />
                                          <div className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-center">دخول</div>
                                        </div>
                                      </nav>
                                      <div className="brand-strip w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                                    </>
                                  )}
                                  
                                  {/* صورة الغلاف */}
                                  <figure className="relative w-full mb-1 overflow-hidden bg-secondary rounded-none">
                                    <div className="relative h-20">
                                      {coverPreview ? (
                                        <img 
                                          src={coverPreview} 
                                          alt="غلاف الألبوم" 
                                          className="absolute inset-0 h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="absolute inset-0 bg-muted" />
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
                                    </div>
                                  </figure>
                                  
                                  {/* المحتوى الرئيسي */}
                                  <main className="px-3 py-2 flex-1 grid place-items-center">
                                    <section className="max-w-full mx-auto text-center">
                                      <h1 className="font-nastaliq text-sm leading-snug font-bold mb-2">
                                        ألبوم {title || "المناسبة"}
                                      </h1>
                                      <p className="text-xs text-muted-foreground mb-3">
                                        {description || "يسعدنا وجودكم — تفضّلوا للدخول إلى الألبوم."}
                                      </p>
                                      <div className="w-full h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                                        الدخول إلى الألبوم
                                      </div>
                                    </section>
                                  </main>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="album">
                            <div className="relative w-full h-[500px] bg-background border-8 border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-slate-800 rounded-b-lg"></div>
                              <div className="h-full overflow-y-auto">
                                <div className="min-h-full bg-background text-foreground flex flex-col" dir="rtl">
                                  {/* هيدر شرطي */}
                                  {showHeader && (
                                    <>
                                      <nav className="w-full bg-background border-b px-2 py-1">
                                        <div className="flex items-center justify-between">
                                          <img src="/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png" alt="عيون cam" className="h-3 w-auto" />
                                          <div className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-center">دخول</div>
                                        </div>
                                      </nav>
                                      <div className="brand-strip w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                                    </>
                                  )}
                                  
                                  {/* صورة الغلاف */}
                                  <figure className="relative w-full mb-1 overflow-hidden bg-secondary rounded-none">
                                    <div className="relative h-20">
                                      {coverPreview ? (
                                        <img 
                                          src={coverPreview} 
                                          alt="غلاف الألبوم" 
                                          className="absolute inset-0 h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="absolute inset-0 bg-muted" />
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
                                    </div>
                                  </figure>
                                  
                                  <main className="flex-1">
                                    {/* عنوان الألبوم */}
                                    <section className="px-3 py-2 text-center">
                                      <h1 className="font-nastaliq text-sm leading-snug font-bold">
                                        {title || "الألبوم"}
                                      </h1>
                                    </section>
                                    
                                    {/* شبكة الصور المصغرة */}
                                    <section className="px-3 pb-3">
                                      <div className="grid grid-cols-3 gap-1">
                                        {[...Array(6)].map((_, i) => (
                                          <div key={i} className="aspect-square bg-muted rounded-sm flex items-center justify-center">
                                            <div className="w-4 h-4 bg-muted-foreground/20 rounded" />
                                          </div>
                                        ))}
                                      </div>
                                    </section>
                                    
                                    {/* أزرار التفاعل */}
                                    <section className="px-3 pb-2">
                                      <div className="flex gap-2">
                                        <div className="flex-1 h-6 bg-primary text-primary-foreground rounded text-xs flex items-center justify-center">
                                          مشاهدة الكل
                                        </div>
                                        <div className="h-6 w-6 bg-red-500 text-white rounded text-xs flex items-center justify-center">
                                          <Heart className="w-3 h-3 fill-current" />
                                        </div>
                                      </div>
                                    </section>
                                  </main>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>

                      {/* Panel اليسار: استمارة بسيطة */}
                      <div className="lg:col-span-3 space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-right">معلومات المناسبة</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label>عنوان المناسبة</Label>
                              <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="أدخل عنوان المناسبة"
                              />
                            </div>
                            <div>
                              <Label>وصف المناسبة</Label>
                              <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="وصف قصير عن المناسبة"
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label>صورة الغلاف</Label>
                              <div className="mt-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setCoverFile(file);
                                  }}
                                  className="hidden"
                                  id="cover-upload"
                                />
                                <label
                                  htmlFor="cover-upload"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md border cursor-pointer hover:bg-secondary/80"
                                >
                                  <Upload className="w-4 h-4" />
                                  رفع صورة الغلاف
                                </label>
                                {coverFile && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    تم اختيار: {coverFile.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* إخفاء اللوجو */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">إخفاء شعار "عيون cam"</Label>
                                <p className="text-xs text-muted-foreground">
                                  يمكنك إخفاء الشعار من جميع الصفحات
                                </p>
                              </div>
                              <Switch
                                checked={!showHeader}
                                onCheckedChange={(checked) => setShowHeader(!checked)}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* ملاحظة */}
                        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                          <CardContent className="pt-6">
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              💡 <strong>ملاحظة:</strong> بعد إنشاء المناسبة، يمكنك تخصيص كل شاشة على حدة من لوحة التحكم. 
                              ستتمكن من تغيير الصور والنصوص والألوان لكل صفحة بشكل منفصل.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Participants */}
                {step === 4 && (
                  <div className="grid gap-4">
                    <div>
                      <Label>عدد المشاركين المتوقع</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {guestOptions.map((g) => (
                          <Pill key={g} selected={guests === g} onClick={() => setGuests(g)}>
                            {g}
                          </Pill>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>عدد اللقطات لكل مشارك</Label>
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

                {/* Step 5: Final */}
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

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        أوافق على{" "}
                        <a href="/terms" target="_blank" className="text-primary hover:underline">
                          الشروط والأحكام
                        </a>{" "}
                        و{" "}
                        <a href="/privacy" target="_blank" className="text-primary hover:underline">
                          سياسة الخصوصية
                        </a>
                      </Label>
                    </div>

                    <Button
                      onClick={submit}
                      disabled={submitting || !termsAccepted || !userId}
                      className="w-full"
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      إنشاء المناسبة
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={prev}
              disabled={step === 1}
              className="flex items-center gap-2"
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={next}
                disabled={!canNext}
                className="flex items-center gap-2"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={submitting || !termsAccepted || !userId}
                className="flex items-center gap-2"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                إنشاء المناسبة
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}