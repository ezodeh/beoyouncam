import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus, X, ChevronLeft, ChevronRight, PartyPopper, Images, Users } from "lucide-react";
const dummyMessages = [
  { id: 1, name: "خالد", text: "ألف مبروك وربنا يتمّم على خير!", at: "قبل ساعتين" },
  { id: 2, name: "محمد", text: "يا رب أيامكم كلها فرح وسعادة.", at: "أمس" },
  { id: 3, name: "سارة", text: "ابتسامات لا تنتهي!", at: "منذ 3 أيام" },
];

const dummyPhotos = new Array(15).fill(0).map((_, i) => ({ id: i + 1 }));
const dummyAlbums = ["خالد", "محمد", "سارة", "ليلى", "نور"]; // بعيون ...

export default function EventAlbum() {
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "ألبوم المناسبة";

  useEffect(() => {
    document.title = `${eventName} — من عيونكم`;
  }, [eventName]);

  // مباركات
  const [isBlessingOpen, setBlessingOpen] = useState(false);
  const [blessingName, setBlessingName] = useState("");
  const [blessingText, setBlessingText] = useState("");
  const { toast } = useToast();

// عارض الصور (فول سكرين)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = dummyPhotos.map(() => coverImg); // مؤقتًا نفس الصورة كعنصر توضيحي
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () => setLightboxIndex((idx) => (idx === null ? null : (idx + 1) % images.length));
  const prevImage = () => setLightboxIndex((idx) => (idx === null ? null : (idx - 1 + images.length) % images.length));
  // سوايب رأسي مثل تيكتوك
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const handleTouchStart = (e: any) => {
    setTouchStartY(e.touches?.[0]?.clientY ?? null);
  };
  const handleTouchEnd = (e: any) => {
    if (touchStartY === null) return;
    const dy = (e.changedTouches?.[0]?.clientY ?? touchStartY) - touchStartY;
    if (Math.abs(dy) > 50) {
      if (dy < 0) nextImage();
      else prevImage();
    }
    setTouchStartY(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1">
        <header className="relative">
          <figure className="h-44 sm:h-56 md:h-64 w-full overflow-hidden">
            <img
              src={coverImg}
              alt="غلاف المناسبة"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </figure>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/10" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="container mx-auto px-4 py-4">
              <h1 className="font-aref text-3xl sm:text-4xl font-extrabold text-right">{eventName}</h1>
              <p className="text-sm text-muted-foreground">رمز المناسبة: {token}</p>
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-6">
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md rounded-full mx-auto">
              <TabsTrigger value="congrats" aria-label="المباركات">
                <PartyPopper className="h-5 w-5" />
                <span className="sr-only">المباركات</span>
              </TabsTrigger>
              <TabsTrigger value="photos" aria-label="الصور">
                <Images className="h-5 w-5" />
                <span className="sr-only">الصور</span>
              </TabsTrigger>
              <TabsTrigger value="albums" aria-label="الألبومات">
                <Users className="h-5 w-5" />
                <span className="sr-only">الألبومات</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="congrats" className="mt-6">
              <div className="grid gap-3 max-w-3xl mx-auto">
                {dummyMessages.map((m) => (
                  <Card key={m.id} className="bg-card border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.at}</div>
                      </div>
                      <p className="mt-2 text-sm leading-6">{m.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* زر إضافة مباركة */}
              <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center">
                <Button
                  onClick={() => setBlessingOpen(true)}
                  className="h-14 w-14 rounded-full shadow-lg"
                  aria-label="أضف مباركة"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>

              {/* Dialog إضافة مباركة */}
              <Dialog open={isBlessingOpen} onOpenChange={setBlessingOpen}>
                <DialogContent dir="rtl" className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>إضافة مباركة</DialogTitle>
                    <DialogDescription>اكتب رسالتك الجميلة مع اسمك.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">المباركة</label>
                      <Textarea
                        value={blessingText}
                        onChange={(e) => setBlessingText(e.target.value)}
                        placeholder="اكتب المباركة هنا..."
                        rows={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">الاسم</label>
                      <Input
                        value={blessingName}
                        onChange={(e) => setBlessingName(e.target.value)}
                        placeholder="الاسم"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setBlessingOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        setBlessingOpen(false);
                        setBlessingName("");
                        setBlessingText("");
                        toast({ title: "تم نشر المباركة" });
                      }}
                    >
                      نشر
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="photos" className="mt-6">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                  {dummyPhotos.map((p, idx) => (
                    <button
                      key={p.id}
                      className="aspect-square overflow-hidden rounded-md border border-border bg-muted"
                      onClick={() => setLightboxIndex(idx)}
                      aria-label={`عرض الصورة رقم ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="albums" className="mt-6">
              <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {dummyAlbums.map((name, i) => (
                  <Link key={i} to={`/album/${token}/by/${encodeURIComponent(name)}`} aria-label={`ألبوم بعيون ${name}`}>
                    <Card className="bg-card border border-border hover:shadow-elevated transition-shadow" role="link">
                      <CardContent className="p-4">
                        <div className="aspect-video rounded-md bg-muted mb-3" />
                        <div className="font-bold">بعيون {name}</div>
                        <p className="text-sm text-muted-foreground">ألبوم شخصي من صور وفيديو {name}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 text-white"
          dir="rtl"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={closeLightbox}
            aria-label="إغلاق"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute top-4 left-4 text-sm">{String(lightboxIndex + 1).padStart(2, "0")}/{images.length}</div>

          <div className="h-full w-full flex items-center justify-center p-4">
            <img src={images[lightboxIndex]} alt={`صورة رقم ${lightboxIndex + 1}`} className="max-h-full max-w-full object-contain" />
          </div>

          <div className="absolute inset-y-0 start-0 flex items-center p-4">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={prevImage} aria-label="السابق">
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>
          <div className="absolute inset-y-0 end-0 flex items-center p-4">
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
