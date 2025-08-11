import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, ArrowRight, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Dummy data - will be replaced with real data from Supabase

const dummyMessages = [
  { id: 1, name: "أحمد", text: "مبارك عليكم العرس وعقبال مليون سنة سعيدة" },
  { id: 2, name: "فاطمة", text: "الله يتمم عليكم بخير وعافية" },
  { id: 3, name: "محمد", text: "عقبال الفرحة القادمة إن شاء الله" }
];

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `بعيون ${name} — من عيونكم`;
  }, [name]);

  const [shareCount, setShareCount] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isEventOwner, setIsEventOwner] = useState<boolean>(false);
  
  // Extract person name from URL or use fallback
  const personName = name || "الضيف";

  useEffect(() => {
    const checkOwnership = async () => {
      if (!token) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from("events")
        .select("owner_id")
        .eq("token", token)
        .single();
      
      setIsEventOwner(session.user.id === data?.owner_id);
    };
    checkOwnership();
    fetchPhotos();
  }, [token]);

  const fetchPhotos = async () => {
    if (!token || !name) return;
    setLoading(true);
    try {
      // Get participant ID by name
      const { data: participant } = await supabase
        .from("participants")
        .select("id")
        .eq("event_token", token)
        .eq("name", name)
        .single();

      if (!participant) {
        setPhotos([]);
        return;
      }

      // Get media submissions for this participant
      const { data: submissions } = await supabase
        .from("media_submissions")
        .select("*")
        .eq("participant_id", participant.id)
        .order("created_at", { ascending: false });

      if (submissions) {
        const photosWithUrls = submissions.map(submission => {
          const { data: { publicUrl } } = supabase.storage
            .from("event-media")
            .getPublicUrl(submission.file_path);
          
          return {
            id: submission.id,
            src: publicUrl,
            alt: `صورة من ${name}`,
            type: submission.media_type === "video" ? "video" : "image"
          };
        });
        setPhotos(photosWithUrls);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
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
      // الحصول على معرف المشارك
      const { data: participant } = await supabase
        .from("participants")
        .select("id")
        .eq("event_token", token)
        .eq("name", name)
        .single();

      if (!participant) return;

      // حذف الملفات من media_submissions
      const { data: submissions } = await supabase
        .from("media_submissions")
        .select("file_path, file_name")
        .eq("participant_id", participant.id);

      if (submissions && submissions.length > 0) {
        // حذف الملفات من التخزين
        const filePaths = submissions.map(s => s.file_path);
        await supabase.storage
          .from("event-media")
          .remove(filePaths);

        // حذف السجلات من قاعدة البيانات
        await supabase
          .from("media_submissions")
          .delete()
          .eq("participant_id", participant.id);
      }

      toast({ title: `تم حذف جميع صور ${name}` });
    } catch (error) {
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
              src={coverImg}
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
            <span className="rounded-full bg-background/80 text-foreground text-xs px-2 py-1 border border-border">{shareCount}</span>
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
            <h2 className="text-lg font-nastaliq font-bold">مباركات {name}</h2>
            {dummyMessages.filter((m) => m.name === personName).length > 0 ? (
              dummyMessages
                .filter((m) => m.name === personName)
                .map((m) => (
                  <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="text-sm font-nastaliq font-semibold mb-1">{m.name}</div>
                    <p className="text-sm text-muted-foreground leading-6 text-right">{m.text}</p>
                  </div>
                ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                ما في مباركة من {personName} بعد
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
