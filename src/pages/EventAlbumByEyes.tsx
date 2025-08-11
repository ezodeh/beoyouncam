import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, ArrowRight, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Blessing {
  id: string;
  content: string;
  name: string;
  created_at: string;
}

const mediaItems = [
  { id: 1, src: "/lovable-uploads/0200d767-58b7-4ed9-8589-ae65fa2df295.png", alt: "صورة من المناسبة 1", type: "image" },
  { id: 2, src: "/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png", alt: "صورة من المناسبة 2", type: "image" },
  { id: 3, src: "/lovable-uploads/20d80c41-6fd7-4376-bc5d-1b8d9fac079f.png", alt: "صورة من المناسبة 3", type: "image" },
  { id: 4, src: "/lovable-uploads/3abf2523-09b8-4264-b731-d9f044049749.png", alt: "صورة من المناسبة 4", type: "image" },
  { id: 5, src: "/lovable-uploads/6ff975c7-0141-4e6b-9d33-48024a875e58.png", alt: "صورة من المناسبة 5", type: "image" },
  { id: 6, src: "/lovable-uploads/d215095f-b0af-4ffe-a216-0e23507e61f7.png", alt: "صورة من المناسبة 6", type: "image" },
  { id: 7, src: "/lovable-uploads/e635fc05-a945-415e-9dae-80f972c792cf.png", alt: "صورة من المناسبة 7", type: "image" },
  { id: 8, src: "/lovable-uploads/feffbd15-6f18-425a-baed-b8539b349521.png", alt: "صورة من المناسبة 8", type: "image" },
  { id: 9, src: "/lovable-uploads/0200d767-58b7-4ed9-8589-ae65fa2df295.png", alt: "صورة من المناسبة 9", type: "image" },
  { id: 10, src: "/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png", alt: "صورة من المناسبة 10", type: "image" },
  { id: 11, src: "/lovable-uploads/20d80c41-6fd7-4376-bc5d-1b8d9fac079f.png", alt: "صورة من المناسبة 11", type: "image" },
  { id: 12, src: "/lovable-uploads/3abf2523-09b8-4264-b731-d9f044049749.png", alt: "صورة من المناسبة 12", type: "image" }
];


export default function EventAlbumByEyes() {
  const { token, name } = useParams();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<any[]>([]);
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Debug: log URL parameters
  useEffect(() => {
    console.log("🔍 URL Parameters:", { token, name });
    console.log("🌐 Current URL:", window.location.href);
    console.log("🔗 Search params:", window.location.search);
    console.log("📍 Pathname:", window.location.pathname);
  }, [token, name]);

  useEffect(() => {
    document.title = `بعيون ${name} — من عيونكم`;
  }, [name]);

  const [shareCount, setShareCount] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isEventOwner, setIsEventOwner] = useState<boolean>(false);
  
  // Extract person name from URL or use fallback
  const personName = name || "الضيف";

  // Debug info display
  if (!token || !name) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center" dir="rtl">
        <div className="text-center p-8 border border-border rounded-lg">
          <h2 className="text-xl font-bold mb-4">معلومات التشخيص</h2>
          <p>Token: {token || "غير موجود"}</p>
          <p>Name: {name || "غير موجود"}</p>
          <p>URL: {window.location.href}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            يرجى التأكد من أن الرابط صحيح ويحتوي على token و name
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const checkOwnership = async () => {
      if (!token) return;
      console.log("🔐 Checking ownership for token:", token);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("events")
        .select("owner_id")
        .eq("token", token)
        .maybeSingle();
      
      if (error) {
        console.error("❌ Error checking ownership:", error);
        return;
      }
      
      console.log("✅ Event data:", data);
      setIsEventOwner(session.user.id === data?.owner_id);
    };
    
    const fetchEventData = async () => {
      if (!token) return;
      console.log("📄 Fetching event data for token:", token);
      
      try {
        const { data, error } = await supabase
          .from("events")
          .select("title, cover_url, album_cover_url")
          .eq("token", token)
          .maybeSingle();
        
        if (error) {
          console.error("❌ Error fetching event:", error);
          return;
        }
        
        console.log("✅ Event found:", data);
        setEventData(data);
      } catch (error) {
        console.error("❌ Exception fetching event data:", error);
      }
    };

    const fetchBlessings = async () => {
      if (!token) return;
      try {
        const { data, error } = await supabase
          .from("blessings")
          .select("*")
          .eq("event_token", token)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setBlessings(data || []);
      } catch (error) {
        console.error("Error fetching blessings:", error);
        setBlessings([]);
      }
    };

    checkOwnership();
    fetchEventData();
    fetchBlessings();
    fetchPhotos();
  }, [token]);

  const fetchPhotos = async () => {
    if (!token || !name) return;
    setLoading(true);
    try {
      console.log("🔍 Fetching photos for:", { token, name });
      
      // Get participant ID by name (with flexible matching)
      const { data: participants } = await supabase
        .from("participants")
        .select("id, name")
        .eq("event_token", token)
        .ilike("name", `%${name}%`); // استخدام ilike للمطابقة المرنة

      console.log("👥 Found participants:", participants);

      if (!participants || participants.length === 0) {
        console.log("❌ No participant found with name:", name);
        setPhotos([]);
        return;
      }

      // إذا وُجد أكثر من مشارك، نأخذ الأول
      const participant = participants[0];
      console.log("✅ Using participant:", participant);

      // Get media submissions for this participant
      const { data: submissions, error: submissionsError } = await supabase
        .from("media_submissions")
        .select("*")
        .eq("participant_id", participant.id)
        .order("created_at", { ascending: false });

      console.log("📸 Media submissions:", { submissions, error: submissionsError });

      if (submissionsError) {
        console.error("❌ Error fetching submissions:", submissionsError);
        setPhotos([]);
        return;
      }

      if (submissions && submissions.length > 0) {
        const photosWithUrls = submissions.map(submission => {
          const { data: { publicUrl } } = supabase.storage
            .from("event-media")
            .getPublicUrl(submission.file_path);
          
          console.log("🖼️ Generated URL for:", submission.file_path, "->", publicUrl);
          
          return {
            id: submission.id,
            src: publicUrl,
            alt: `صورة من ${name}`,
            type: submission.media_type === "video" ? "video" : "image",
            name: submission.file_name
          };
        });
        
        console.log("✅ Photos with URLs:", photosWithUrls);
        setPhotos(photosWithUrls);
      } else {
        console.log("ℹ️ No submissions found for participant");
        setPhotos([]);
      }
    } catch (error) {
      console.error("❌ Error fetching photos:", error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  // Lightbox functions
  const openAt = (index: number) => setLightboxIndex(index);
  const close = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex(prev => prev === null ? null : prev > 0 ? prev - 1 : photos.length - 1);
  const next = () => setLightboxIndex(prev => prev === null ? null : prev < photos.length - 1 ? prev + 1 : 0);

  const sharePage = async () => {
    const url = window.location.href;
    const title = `بعيون ${name} — من عيونكم`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title, url }); setShareCount((c)=>c+1); } catch(_){}
    } else {
      try { await navigator.clipboard.writeText(url); setShareCount((c)=>c+1); toast({ title: "تم نسخ رابط المشاركة" }); } catch(_){}
    }
  };

  const deleteParticipantMedia = async () => {
    if (!confirm(`هل أنت متأكد من حذف جميع صور ${name}؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    try {
      console.log("🗑️ Starting deletion for participant:", name);
      
      // الحصول على معرف المشارك بنفس المنطق المحسن
      const { data: participants } = await supabase
        .from("participants")
        .select("id, name")
        .eq("event_token", token)
        .ilike("name", `%${name}%`);

      if (!participants || participants.length === 0) {
        console.log("❌ No participant found for deletion");
        return;
      }

      const participant = participants[0];
      console.log("✅ Found participant for deletion:", participant);

      // حذف الملفات من media_submissions
      const { data: submissions } = await supabase
        .from("media_submissions")
        .select("file_path, file_name")
        .eq("participant_id", participant.id);

      if (submissions && submissions.length > 0) {
        console.log("📁 Files to delete:", submissions.length);
        
        // حذف الملفات من التخزين
        const filePaths = submissions.map(s => s.file_path);
        const { error: storageError } = await supabase.storage
          .from("event-media")
          .remove(filePaths);

        if (storageError) {
          console.error("❌ Storage deletion error:", storageError);
        }

        // حذف السجلات من قاعدة البيانات
        const { error: dbError } = await supabase
          .from("media_submissions")
          .delete()
          .eq("participant_id", participant.id);

        if (dbError) {
          console.error("❌ Database deletion error:", dbError);
        }

        // تحديث الواجهة
        setPhotos([]);
      }

      toast({ title: `تم حذف جميع صور ${name}` });
      console.log("✅ Deletion completed successfully");
      
    } catch (error) {
      console.error("❌ Error during deletion:", error);
      toast({ title: "خطأ", description: "تعذّر حذف الصور", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1">
        <header className="relative">
          <figure className="h-44 sm:h-56 md:h-64 w-full overflow-hidden">
            <img
              src={eventData?.album_cover_url || eventData?.cover_url || coverImg}
              alt={`غلاف ألبوم بعيون ${name}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </figure>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/10 pointer-events-none" />
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={sharePage} aria-label="مشاركة الصفحة">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">مشاركة</span>
            </Button>
            <Link to={`/album/${token}`}>
              <Button size="sm" variant="secondary" className="rounded-full" aria-label="رجوع للألبوم">
                <ArrowRight className="h-4 w-4" />
                <span className="hidden sm:inline">رجوع للألبوم</span>
              </Button>
            </Link>
          </div>
          <div className="absolute inset-x-0 bottom-0">
            <div className="container mx-auto px-4 py-4">
              <h1 className="font-nastaliq text-3xl sm:text-4xl font-extrabold">بعيون {name}</h1>
              <p className="text-sm text-muted-foreground">رمز المناسبة: {token}</p>
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                جاري تحميل الصور...
              </div>
            ) : (
              <>
                {isEventOwner && photos.length > 0 && (
                  <div className="mb-4 flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteParticipantMedia}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف جميع صور {name}
                    </Button>
                  </div>
                )}
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                    {photos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => openAt(idx)}
                        className="aspect-square overflow-hidden rounded-md border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label={`فتح الصورة ${idx + 1} بملء الشاشة`}
                      >
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    لا يوجد صور من {name}
                  </div>
                )}
              </>
            )}
          </div>
          <aside className="space-y-3">
            <h2 className="text-lg font-nastaliq font-bold">المباركات</h2>
            {blessings.length > 0 ? (
              blessings.map((blessing) => (
                <div key={blessing.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="text-sm font-nastaliq font-semibold mb-1">{blessing.name}</div>
                  <p className="text-sm text-muted-foreground leading-6 text-right">{blessing.content}</p>
                  <span className="text-xs text-muted-foreground mt-2 block">
                    {new Date(blessing.created_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                لا توجد مباركات بعد
              </div>
            )}
          </aside>
        </section>
        {lightboxIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/90 text-white" dir="rtl">
            {/* Close + Share like main album (right side) */}
            <button
              onClick={close}
              className="absolute top-4 right-4 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-2"
              aria-label="إغلاق العرض الكامل"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={async () => {
                const url = window.location.href + `#${lightboxIndex!+1}`;
                const title = mediaItems[lightboxIndex!].alt || "صورة";
                if ((navigator as any).share) {
                  try { await (navigator as any).share({ title, url }); } catch(_){}
                } else {
                  try { await navigator.clipboard.writeText(url); toast({ title: "تم نسخ رابط المشاركة" }); } catch(_){}
                }
              }}
              className="absolute top-4 right-16 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-2"
              aria-label="مشاركة"
            >
              <Share2 className="h-5 w-5" />
            </button>

            {/* Index and name like main album (left top) */}
            <div className="absolute top-4 left-4 text-sm">
              <div>{String(lightboxIndex + 1).padStart(2, "0")}/{photos.length}</div>
              <div className="font-nastaliq text-xs mt-1">بعيون {name}</div>
            </div>

            {/* Prev/Next */}
            <button
              onClick={prev}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-2"
              aria-label="السابق"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <button
              onClick={next}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-2"
              aria-label="التالي"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="h-full w-full flex items-center justify-center p-4">
              {photos[lightboxIndex]?.type === "video" ? (
                <video
                  src={photos[lightboxIndex].src}
                  className="max-h-[88vh] max-w-[92vw] rounded-lg shadow-lg"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={photos[lightboxIndex]?.src}
                  alt={photos[lightboxIndex]?.alt}
                  className="max-h-[88vh] max-w-[92vw] object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
