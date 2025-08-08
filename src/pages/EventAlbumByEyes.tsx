import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";

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
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/10" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold">بعيون {name}</h1>
              <p className="text-sm text-muted-foreground">رمز المناسبة: {token}</p>
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
              {dummyPhotos.map((p) => (
                <div key={p.id} className="aspect-square overflow-hidden rounded-md border border-border bg-muted" />
              ))}
            </div>
          </div>
          <aside className="space-y-3">
            <h2 className="text-lg font-bold">مباركات {name}</h2>
            {dummyMessages.map((m) => (
              <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                <div className="text-sm font-semibold mb-1">{m.name}</div>
                <p className="text-sm text-muted-foreground leading-6">{m.text}</p>
              </div>
            ))}
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
