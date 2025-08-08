import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const dummyMessages = [
  { id: 1, name: "خالد", text: "ألف مبروك وربنا يتمّم على خير!", at: "قبل ساعتين" },
  { id: 2, name: "محمد", text: "يا رب أيامكم كلها فرح وسعادة.", at: "أمس" },
  { id: 3, name: "سارة", text: "ابتسامات لا تنتهي!", at: "منذ 3 أيام" },
];

const dummyPhotos = new Array(15).fill(0).map((_, i) => ({ id: i + 1 }));
const dummyAlbums = ["خالد", "محمد", "سارة", "ليلى", "نور"]; // بعيون ...

export default function EventAlbum() {
  const { token } = useParams();

  useEffect(() => {
    document.title = "ألبوم المناسبة — من عيونكم";
  }, []);

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
              <h1 className="text-3xl sm:text-4xl font-extrabold">ألبوم المناسبة</h1>
              <p className="text-sm text-muted-foreground">رمز المناسبة: {token}</p>
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-6">
          <Tabs defaultValue="congrats" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md rounded-full mx-auto">
              <TabsTrigger value="congrats">المباركات</TabsTrigger>
              <TabsTrigger value="photos">الصور</TabsTrigger>
              <TabsTrigger value="albums">الألبومات</TabsTrigger>
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
            </TabsContent>

            <TabsContent value="photos" className="mt-6">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                  {dummyPhotos.map((p) => (
                    <div key={p.id} className="aspect-square overflow-hidden rounded-md border border-border bg-muted" />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="albums" className="mt-6">
              <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {dummyAlbums.map((name, i) => (
                  <Card key={i} className="bg-card border border-border hover:shadow-elevated transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-video rounded-md bg-muted mb-3" />
                      <div className="font-bold">بعيون {name}</div>
                      <p className="text-sm text-muted-foreground">ألبوم شخصي من صور وفيديو {name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
}
