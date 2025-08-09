import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, ChevronLeft, ChevronRight, PartyPopper, Images, SquareStack, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
// سنجلب الوسائط من التخزين بدل البيانات التجريبية
interface MediaItem { url: string; type: "image" | "video"; createdAt?: string | null; name: string }


export default function EventAlbum() {
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "ألبوم المناسبة";
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>(eventName);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    document.title = `الألبوم — ${title} — من عيونكم`;
  }, [title]);

  // تأكيد المرور بشاشة المقدمة أولاً
  useEffect(() => {
    if (!token) return;
    const seen = sessionStorage.getItem(`intro_${token}`);
    if (!seen) {
      navigate(`/album/${token}/intro?title=${encodeURIComponent(eventName)}`);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data } = await supabase.from("events").select("is_private, published_at, title, cover_url").eq("token", token).maybeSingle();
      if (data?.is_private && (!data.published_at || new Date(data.published_at) > new Date())) {
        navigate(`/event/${token}/soon?title=${encodeURIComponent(title)}`);
        return;
      }
      if (data) {
        setTitle(data.title || eventName);
        setCoverUrl(data.cover_url || null);
      }
    })();
  }, [token]);

  // وسائط الألبوم من التخزين
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoadingMedia(true);
      try {
        const prefix = `events/${token}`;
        const { data: files, error } = await supabase.storage
          .from("event-media")
          .list(prefix, { limit: 1000, sortBy: { column: "created_at", order: "asc" } as any });
        if (error) throw error;
        const items: MediaItem[] = (files || []).filter((f: any) => !String(f.name || "").startsWith(".")).map((f: any) => {
          const { data: pub } = supabase.storage.from("event-media").getPublicUrl(`${prefix}/${f.name}`);
          const ext = String(f.name || "").split(".").pop()?.toLowerCase() || "";
          const type: "image" | "video" = ["jpg","jpeg","png","webp","gif","heic","heif","avif"].includes(ext) ? "image" : "video";
          return { url: pub.publicUrl, type, createdAt: (f as any).created_at ?? null, name: f.name };
        });
        items.sort((a,b)=> (a.createdAt && b.createdAt) ? (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : a.name.localeCompare(b.name));
        setMedia(items);
      } catch (_) {
        toast({ title: "تعذّر تحميل الوسائط" });
      } finally {
        setLoadingMedia(false);
      }
    })();
  }, [token]);

  // عارض الصور (فول سكرين)
  const imageItems = media.filter((m)=>m.type === "image");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () => setLightboxIndex((idx) => (idx === null ? null : (idx + 1) % imageItems.length));
  const prevImage = () => setLightboxIndex((idx) => (idx === null ? null : (idx - 1 + imageItems.length) % imageItems.length));
  // سوايب رأسي مثل تيكتوك
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const handleTouchStart = (e: any) => { setTouchStartY(e.touches?.[0]?.clientY ?? null); };
  const handleTouchEnd = (e: any) => {
    if (touchStartY === null) return;
    const dy = (e.changedTouches?.[0]?.clientY ?? touchStartY) - touchStartY;
    if (Math.abs(dy) > 50) { if (dy < 0) nextImage(); else prevImage(); }
    setTouchStartY(null);
  };

  const shareCurrent = async () => {
    if (lightboxIndex === null) return;
    const shareUrl = window.location.href;
    const t = `الألبوم — ${title}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: t, url: shareUrl }); } catch (_) {}
    } else {
      try { await navigator.clipboard.writeText(shareUrl); toast({ title: "تم نسخ رابط المشاركة" }); } catch (_) {}
    }
  };

  const shareAlbum = async () => {
    const shareUrl = window.location.href;
    const t = `الألبوم — ${title}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: t, url: shareUrl }); } catch (_) {}
    } else {
      try { await navigator.clipboard.writeText(shareUrl); toast({ title: "تم نسخ رابط المشاركة" }); } catch (_) {}
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1">
        <header className="relative">
          <figure className="h-44 sm:h-56 md:h-64 w-full overflow-hidden">
            <img
              src={coverUrl || coverImg}
              alt={`غلاف ${title}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </figure>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/10 pointer-events-none" />
          <div className="absolute top-3 left-3 z-20">
            <Button size="sm" variant="outline" className="rounded-full" onClick={shareAlbum} aria-label="مشاركة الألبوم">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">مشاركة</span>
            </Button>
          </div>
          <div className="absolute inset-x-0 bottom-0">
            <div className="container mx-auto px-4 py-4">
              <h1 className="font-nastaliq text-3xl sm:text-4xl font-extrabold text-right">الألبوم — {title}</h1>
              <p className="text-sm text-muted-foreground">رمز المناسبة: {token}</p>
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-6">
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="grid grid-cols-1 w-full max-w-xs rounded-full mx-auto">
              <TabsTrigger value="photos" aria-label="الصور">
                <Images className="h-5 w-5" />
                <span className="sr-only">الصور</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="mt-6">
              <div className="max-w-5xl mx-auto">
                {loadingMedia ? (
                  <div className="text-center text-sm text-muted-foreground py-10">جارٍ تحميل الصور…</div>
                ) : imageItems.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-10">لا توجد صور بعد</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                    {imageItems.map((it, idx) => (
                      <button
                        key={it.name + idx}
                        className="aspect-square overflow-hidden rounded-md border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                        onClick={() => setLightboxIndex(idx)}
                        aria-label={`عرض الصورة رقم ${idx + 1}`}
                      >
                        <img src={it.url} alt={`صورة ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {lightboxIndex !== null && (
         <div
           className="fixed inset-0 z-50 bg-black/90 text-white"
           dir="rtl"
           tabIndex={-1}
           onKeyDown={(e) => { if (e.key === "Escape") closeLightbox(); }}
           onTouchStart={handleTouchStart}
           onTouchEnd={handleTouchEnd}
         >
          <button
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            aria-label="إغلاق"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute top-4 right-16 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); shareCurrent(); }}
            aria-label="مشاركة"
          >
            <Share2 className="h-6 w-6" />
          </button>

          <div className="absolute top-4 left-4 text-sm">{String(lightboxIndex + 1).padStart(2, "0")}/{imageItems.length}</div>

          <div className="h-full w-full flex items-center justify-center p-4">
            <img src={imageItems[lightboxIndex!].url} alt={`صورة رقم ${lightboxIndex! + 1}`} className="max-h-full max-w-full object-contain" />
          </div>

          <div className="absolute inset-y-0 start-0 z-10 flex items-center p-4">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={prevImage} aria-label="السابق">
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>
          <div className="absolute inset-y-0 end-0 z-10 flex items-center p-4">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={nextImage} aria-label="التالي">
              <ChevronLeft className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
