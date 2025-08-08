import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link, useParams, useLocation } from "react-router-dom";
import { useEffect } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";
import { Button } from "@/components/ui/button";

export default function EventAlbumIntro() {
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "ألبومكم";
  useEffect(() => {
    document.title = `مقدمة الألبوم — ${eventName} — من عيونكم`;
  }, [eventName]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1">
        <header className="relative">
          <figure className="h-[110vh] sm:h-[70vh] md:h-96 w-full overflow-hidden">
            <img
              src={coverImg}
              alt="صورة غلاف المناسبة"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </figure>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/10 pointer-events-none" />

          <div className="absolute inset-x-0 bottom-8 sm:static sm:inset-auto container z-20 mx-auto px-4 sm:-mt-14">
            <div className="mx-auto max-w-2xl rounded-xl border bg-card text-card-foreground shadow-lg p-6 sm:p-8">
              <h1 className="font-nastaliq text-3xl sm:text-4xl font-extrabold text-center mb-2">أهلًا وسهلًا في ألبوم {eventName}</h1>
              <p className="text-center text-muted-foreground mb-6">
                يسعدنا وجودكم معنا ومشاركتكم فرحتنا. اضغطوا أدناه للانتقال إلى الألبوم.
              </p>
              <div className="flex justify-center">
                <Link to={`/album/${token}`}>
                  <Button size="lg" className="rounded-full px-8">الدخول إلى الألبوم</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>
      </main>
      <div className="hidden sm:block"><Footer /></div>
    </div>
  );
}
