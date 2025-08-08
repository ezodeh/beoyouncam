import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Share2, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";

const dummyPhotos = new Array(18).fill(0).map((_, i) => ({ id: i + 1 }));
const dummyMessages = [
  { id: 1, name: "خالد", text: "مبارك وربي يتمّم لكم على خير!" },
  { id: 2, name: "ليلى", text: "أيامكم كلها فرح وسعادة" },
];

export default function EventAlbumByEyes() {
  const { token, name } = useParams();

  useEffect(() => {
    document.title = `بعيون ${name} — من عيونكم`;
  }, [name]);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const mediaItems: { type: "image" | "video"; src: string; alt?: string }[] = dummyPhotos.map((_, i) => ({
    type: "image",
    src: coverImg,
    alt: `صورة ${i + 1} بعيون ${name}`,
  }));

  const openAt = (i: number) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((idx) => (idx === null ? idx : (idx - 1 + mediaItems.length) % mediaItems.length));
  const next = () => setLightboxIndex((idx) => (idx === null ? idx : (idx + 1) % mediaItems.length));

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, mediaItems.length]);

  const { toast } = useToast();
  const sharePage = async () => {
    const url = window.location.href;
    const title = `بعيون ${name} — من عيونكم`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title, url });
      } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "تم نسخ رابط المشاركة" });
      } catch (_) {}
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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
{dummyPhotos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => openAt(idx)}
                  className="aspect-square overflow-hidden rounded-md border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={`فتح الصورة ${idx + 1} بملء الشاشة`}
                >
                  <img
                    src={mediaItems[idx].src}
                    alt={mediaItems[idx].alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
          <aside className="space-y-3">
            <h2 className="text-lg font-nastaliq font-bold">مباركات {name}</h2>
            {dummyMessages.map((m) => (
              <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                <div className="text-sm font-nastaliq font-semibold mb-1">{m.name}</div>
                <p className="text-sm text-muted-foreground leading-6 text-right">{m.text}</p>
              </div>
            ))}
          </aside>
        </section>
        {lightboxIndex !== null && (
          <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm text-foreground">
            <button
              onClick={close}
              className="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center justify-center rounded-full border border-border bg-card/80 p-2 shadow-sm"
              aria-label="إغلاق العرض الكامل"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={prev}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-border bg-card/80 p-2 shadow-sm"
              aria-label="السابق"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <button
              onClick={next}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-border bg-card/80 p-2 shadow-sm"
              aria-label="التالي"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="h-full w-full flex items-center justify-center p-4">
              {mediaItems[lightboxIndex].type === "video" ? (
                <video
                  src={(mediaItems[lightboxIndex] as any).src}
                  className="max-h-[88vh] max-w-[92vw] rounded-lg shadow-lg"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={mediaItems[lightboxIndex].src}
                  alt={mediaItems[lightboxIndex].alt}
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
