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
import { ImageEditor } from "@/components/ui/image-editor";

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
  

  // Step 2
  const [timing, setTiming] = useState<AlbumTiming>();
  const [customPublishAt, setCustomPublishAt] = useState<Date | null>(null);
  const [privacy, setPrivacy] = useState<"public" | "private">("private");
  const [password, setPassword] = useState("");
  const [autoShareToGuests, setAutoShareToGuests] = useState(false);
  const [shareChannel, setShareChannel] = useState<"whatsapp" | "email" | "none">();

  // Step 3 - Page Customization
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [welcomeTitle, setWelcomeTitle] = useState("أهلاً وسهلاً في اليوم");
  const [welcomeBody, setWelcomeBody] = useState(
    "شكراً بمشاركتكم فرحتنا! صوروا بحب، ما بدنا فلتر مبالغ فيه 🙂."
  );
  const [ctaLabel, setCtaLabel] = useState("للتصوير");
  const [showHeader, setShowHeader] = useState(true);
  
  // Page customization states
  const [welcomePageHeroImage, setWelcomePageHeroImage] = useState<string>("");
  const [welcomePageHeroFile, setWelcomePageHeroFile] = useState<File | null>(null);
  const [welcomePageHeroPreview, setWelcomePageHeroPreview] = useState<string | null>(null);
  const [welcomePageDescription, setWelcomePageDescription] = useState("");
  const [welcomePageButtonText, setWelcomePageButtonText] = useState("ابدأ");
  const [albumWelcomeHeroImage, setAlbumWelcomeHeroImage] = useState<string>("");
  const [albumWelcomeTitle, setAlbumWelcomeTitle] = useState("الألبوم");
  const [albumWelcomeDescription, setAlbumWelcomeDescription] = useState("");
  const [albumPageHeroImage, setAlbumPageHeroImage] = useState<string>("");
  const [albumPageTitle, setAlbumPageTitle] = useState("الألبوم");

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

  // welcome page hero preview
  useEffect(() => {
    if (!welcomePageHeroFile) return setWelcomePageHeroPreview(null);
    const url = URL.createObjectURL(welcomePageHeroFile);
    setWelcomePageHeroPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [welcomePageHeroFile]);

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
        setTiming(d.timing);
        setCustomPublishAt(d.customPublishAt ? new Date(d.customPublishAt) : null);
        setPrivacy(d.privacy ?? "private");
        setPassword(d.password ?? "");
        setAutoShareToGuests(!!d.autoShareToGuests);
        setShareChannel(d.shareChannel);
        setWelcomeTitle(d.welcomeTitle ?? "أهلاً وسهلاً في اليوم");
        setWelcomeBody(d.welcomeBody ?? "");
        setCtaLabel(d.ctaLabel ?? "للتصوير");
        setShowHeader(d.showHeader !== false);
        setGuests(d.guests ?? 100);
        setShotsPerGuest(d.shotsPerGuest ?? 20);
        setEnableVideo(!!d.enableVideo);
        setHasUnsavedChanges(false); // Reset after loading draft
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
      password,
      autoShareToGuests,
      shareChannel,
      welcomeTitle,
      welcomeBody,
      ctaLabel,
      showHeader,
      guests,
      shotsPerGuest,
      enableVideo,
    };
    localStorage.setItem("create_event_draft", JSON.stringify(draft));
    
    // Mark as having unsaved changes if any field has content
    const hasContent = title.trim() || description.trim() || startAt || endAt || 
                       timing || welcomeTitle !== "أهلاً وسهلاً في اليوم" || 
                       welcomeBody !== "شكراً بمشاركتكم فرحتنا! صوروا بحب، ما بدنا فلتر مبالغ فيه 🙂." ||
                       ctaLabel !== "للتصوير" || guests !== 100 || shotsPerGuest !== 20 || 
                       enableVideo || welcomePageHeroFile || welcomePageHeroImage;
    setHasUnsavedChanges(Boolean(hasContent));
  }, [title, description, startAt, endAt, timing, customPublishAt, privacy, password, autoShareToGuests, shareChannel, welcomeTitle, welcomeBody, ctaLabel, showHeader, guests, shotsPerGuest, enableVideo, welcomePageHeroFile, welcomePageHeroImage]);

  // Warning before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'هل أنت متأكد من مغادرة الصفحة؟ لن يتم حفظ التغييرات.';
        return 'هل أنت متأكد من مغادرة الصفحة؟ لن يتم حفظ التغييرات.';
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

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

  // Image upload handler for page customization
  const handleImageUpload = async (file: File, field: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `temp_${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('event-customization')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-customization')
        .getPublicUrl(fileName);

      // Update the appropriate field
      switch (field) {
        case 'welcome_page_hero_image':
          setWelcomePageHeroImage(publicUrl);
          setWelcomePageHeroFile(null);
          setWelcomePageHeroPreview(null);
          break;
        case 'album_welcome_hero_image':
          setAlbumWelcomeHeroImage(publicUrl);
          break;
        case 'album_page_hero_image':
          setAlbumPageHeroImage(publicUrl);
          break;
        default:
          setCoverPreview(publicUrl);
      }
      
      toast({
        title: "تم رفع الصورة بنجاح",
        description: "تم حفظ الصورة وستظهر في المعاينة",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "فشل في رفع الصورة",
        description: "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  // Handle file selection with immediate upload
  const handleFileSelect = async (file: File, field: string) => {
    switch (field) {
      case 'welcome_page_hero_image':
        setWelcomePageHeroFile(file);
        await handleImageUpload(file, field);
        break;
    }
  };

  // price estimation
  const price = useMemo(() => {
    // باقة 5 مشاركين مجانية: 10 لقطات لكل شخص (بدون فيديو)
    if (guests === 5 && shotsPerGuest === 10 && !enableVideo) {
      // الإيميل مجاني، والواتساب غير مجاني
      if (autoShareToGuests && shareChannel === "whatsapp") {
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
    const now = new Date();
    if (currentStep === 1) {
      if (!title.trim()) e.title = "الاسم مطلوب";
      if (!startAt) e.startAt = "مطلوب";
      if (!endAt) e.endAt = "مطلوب";
      if (startAt && startAt < now) e.startAt = "لا يمكن إنشاء مناسبة في الماضي";
      if (endAt && endAt < now) e.endAt = "لا يمكن أن ينتهي الحدث في الماضي";
      if (startAt && endAt && startAt >= endAt) e.endAt = "يجب أن يكون بعد وقت البداية";
    }
    if (currentStep === 2) {
      if (timing === "custom" && !customPublishAt) e.customPublishAt = "حدد وقت النشر";
      if (privacy === "private" && !password.trim()) e.password = "كلمة المرور مطلوبة للألبوم الخاص";
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
      const organizerCountry = detectCountryCode();

      const { error: insErr } = await supabase.from("events").insert({
        token,
        title: title.trim(),
        description: description.trim() || null,
        sign_in_method: "email",
        start_at: startAt ? startAt.toISOString() : null,
        end_at: endAt ? endAt.toISOString() : null,
        cover_url: coverUrl,
        max_shots: shotsPerGuest,
        expected_guests: guests,
        owner_id: userId,
        is_private: isPrivate,
        password: isPrivate ? password.trim() : null,
        published_at: publicationAt,
        country_code: organizerCountry,
        
        enable_video: enableVideo,
        show_header: showHeader,
      });
      if (insErr) throw insErr;

      localStorage.removeItem("create_event_draft");
      setHasUnsavedChanges(false); // Clear unsaved changes flag after successful submission
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

                  {privacy === "private" && (
                    <div className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label>كلمة مرور الألبوم</Label>
                        {errors.password && (
                          <span className="text-xs text-destructive">{errors.password}</span>
                        )}
                      </div>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="أدخل كلمة مرور للألبوم"
                        className="text-right"
                      />
                      <p className="text-xs text-muted-foreground">
                        ستكون مطلوبة للوصول إلى الألبوم
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label>مشاركة الألبوم للحضور تلقائيًا</Label>
                    <Switch checked={autoShareToGuests} onCheckedChange={setAutoShareToGuests} />
                  </div>

                  <div className="grid gap-2">
                    <Label>مشاركة الألبوم عبر</Label>
                    <div className="flex gap-2">
                      <Pill
                        selected={shareChannel === "whatsapp"}
                        onClick={() => setShareChannel("whatsapp")}
                        disabled={!autoShareToGuests}
                      >
                        واتساب
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
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Panel اليسار: تفاصيل المناسبة */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Images className="w-5 h-5" />
                          تفاصيل المناسبة
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div>
                            <Label>صورة الغلاف</Label>
                            <div className="mt-2 space-y-3">
                              {/* Show preview if image is uploaded or file is selected */}
                              {(welcomePageHeroImage || welcomePageHeroPreview) ? (
                                <div className="space-y-2">
                                  <div className="relative">
                                    <img 
                                      src={welcomePageHeroImage || welcomePageHeroPreview || ""} 
                                      alt="صورة الغلاف" 
                                      className="w-full h-32 object-cover rounded-md border"
                                    />
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    {/* Show image editor only after uploading or for local preview */}
                                    {(welcomePageHeroImage || welcomePageHeroPreview) && (
                                      <ImageEditor 
                                        src={welcomePageHeroImage || welcomePageHeroPreview || ""}
                                        onImageChange={(imageData) => {
                                          // Convert blob to file and upload
                                          const file = new File([imageData], 'edited-cover.jpg', { type: 'image/jpeg' });
                                          handleImageUpload(file, 'welcome_page_hero_image');
                                        }}
                                      >
                                        <Button variant="outline" size="sm">
                                          <Eye className="w-4 h-4 mr-2" />
                                          تعديل الأبعاد
                                        </Button>
                                      </ImageEditor>
                                    )}
                                    
                                    {/* Upload button for local file */}
                                    {welcomePageHeroFile && !welcomePageHeroImage && (
                                      <Button 
                                        variant="default" 
                                        size="sm"
                                        onClick={() => handleImageUpload(welcomePageHeroFile, 'welcome_page_hero_image')}
                                      >
                                        <Upload className="w-4 h-4 mr-2" />
                                        رفع الصورة
                                      </Button>
                                    )}
                                    
                                    {/* Replace image button */}
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        document.getElementById('event-hero-upload')?.click();
                                      }}
                                    >
                                      استبدال الصورة
                                    </Button>
                                    
                                    {/* Delete button */}
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setWelcomePageHeroImage("");
                                        setWelcomePageHeroFile(null);
                                        setWelcomePageHeroPreview(null);
                                      }}
                                    >
                                      حذف الصورة
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* Upload button when no image */
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground mb-2">اختر صورة الغلاف للمناسبة</p>
                                  <label
                                    htmlFor="event-hero-upload"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90"
                                  >
                                    <Upload className="w-4 h-4" />
                                    رفع صورة
                                  </label>
                                </div>
                              )}
                              
                              {/* Hidden file input */}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileSelect(file, 'welcome_page_hero_image');
                                }}
                                className="hidden"
                                id="event-hero-upload"
                              />
                            </div>
                          </div>
                        <div>
                          <Label>عنوان المناسبة</Label>
                          <Input
                            value={welcomeTitle}
                            onChange={(e) => setWelcomeTitle(e.target.value)}
                            placeholder="عنوان المناسبة"
                          />
                        </div>
                        <div>
                          <Label>وصف المناسبة</Label>
                          <Textarea
                            value={welcomeBody}
                            onChange={(e) => setWelcomeBody(e.target.value)}
                            placeholder="نص ترحيبي للضيوف"
                            rows={3}
                          />
                        </div>
                        
                        {/* إعدادات إضافية */}
                        <div className="mt-6 pt-4 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium">إخفاء لوجو "من عيونكم"</Label>
                              <p className="text-xs text-muted-foreground">
                                إخفاء اللوجو من جميع صفحات المناسبة
                              </p>
                            </div>
                            <Switch
                              checked={!showHeader}
                              onCheckedChange={(checked) => setShowHeader(!checked)}
                            />
                          </div>
                        </div>
                        
                        {/* ملاحظة */}
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            ℹ️ هذه الإعدادات ستطبق على جميع الشاشات الثلاث (الترحيب، مقدمة الألبوم، الألبوم). 
                            يمكنك تعديل كل شاشة بشكل منفصل من لوحة التحكم بعد إنشاء المناسبة.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Panel اليمين: معاينة الهاتف */}
                  <div className="flex flex-col items-center gap-4">
                    
                    <Tabs value="welcome" className="w-full max-w-xs">
                      <TabsList className="grid w-full grid-cols-3 text-xs">
                        <TabsTrigger value="welcome" className="text-xs">الترحيب</TabsTrigger>
                        <TabsTrigger value="album-intro" className="text-xs">ترحيب الألبوم</TabsTrigger>
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
                                  {welcomePageHeroImage ? (
                                    <img 
                                      src={welcomePageHeroImage} 
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
                                      {title || welcomeTitle || "عنوان الحدث"}
                                    </h1>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      {description || welcomeBody || "يا هلا بكم"}
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
                                      {ctaLabel || "ابدأ"}
                                    </button>
                                  </div>
                                  
                                  {/* خط الفاصل */}
                                  <div className="my-3 flex items-center gap-2">
                                    <div className="h-px bg-border flex-1" />
                                    <span className="text-xs text-muted-foreground">أو</span>
                                    <div className="h-px bg-border flex-1" />
                                  </div>
                                  
                                  {/* زر Google */}
                                  <div className="w-full h-5 bg-muted rounded text-xs flex items-center justify-center"><span dir="ltr">Google</span> التسجيل بـ</div>
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
                                   {welcomePageHeroImage ? (
                                     <img 
                                       src={welcomePageHeroImage} 
                                       alt="غلاف المناسبة" 
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
                                      ألبوم {title || welcomeTitle || "المناسبة"}
                                    </h1>
                                    <p className="text-xs text-muted-foreground mb-3">
                                      {description || welcomeBody || "يسعدنا وجودكم — تفضّلوا للدخول إلى الألبوم."}
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
                                   {welcomePageHeroImage ? (
                                     <img 
                                       src={welcomePageHeroImage} 
                                       alt="غلاف المناسبة" 
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
                                      {title || welcomeTitle || "الألبوم"}
                                    </h1>
                                 </section>
                                
                                {/* تبويبات الألبوم */}
                                <section className="px-3 py-3">
                                  <div className="grid grid-cols-3 w-full max-w-full rounded-full mx-auto bg-muted p-0.5 mb-3">
                                    <div className="flex items-center justify-center text-xs py-1 rounded-full">
                                      <Heart className="w-3 h-3" />
                                    </div>
                                    <div className="flex items-center justify-center text-xs py-1 rounded-full bg-background">
                                      <Images className="w-3 h-3" />
                                    </div>
                                    <div className="flex items-center justify-center text-xs py-1 rounded-full">
                                      <Users className="w-3 h-3" />
                                    </div>
                                  </div>
                                  
                                  {/* شبكة الصور */}
                                  <div className="grid grid-cols-2 gap-1">
                                    {[1,2,3,4].map(i => (
                                      <div key={i} className="aspect-square bg-muted rounded" />
                                    ))}
                                  </div>
                                </section>
                              </main>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
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
                        <span dir="ltr">Google</span> تسجيل الدخول بحساب
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
                            ? shareChannel === "whatsapp"
                              ? "واتساب"
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
                      <Pill selected={shareChannel === 'whatsapp'} onClick={() => setShareChannel('whatsapp')} disabled={!autoShareToGuests}>واتساب</Pill>
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
