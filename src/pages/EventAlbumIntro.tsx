import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function EventAlbumIntro() {
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "ألبومكم";
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>(eventName);
  const [showHeader, setShowHeader] = useState<boolean>(true);
  useEffect(() => {
    document.title = `مقدمة الألبوم — ${title} — من عيونكم`;
  }, [title]);

  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      if (!token) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      const { data } = await supabase
        .from("events")
        .select("is_private, published_at, title, cover_url, show_header, owner_id, is_album_published")
        .eq("token", token)
        .maybeSingle();
        
      if (!data) return;
      
      setTitle(data.title || eventName);
      setCoverUrl(data.cover_url || null);
      setShowHeader(data.show_header !== false);
      
      // Determine if current user is the event owner
      const currentIsEventOwner = session?.user?.id === data.owner_id;
      
      console.log("🔍 Album Intro access check:", {
        isAlbumPublished: data.is_album_published,
        isEventOwner: currentIsEventOwner,
        userId: session?.user?.id,
        ownerId: data.owner_id
      });
      
      // Check if album is published OR user is the owner
      if (!data.is_album_published && !currentIsEventOwner) {
        console.log("🚫 Album not published and user is not owner, redirecting to soon page");
        navigate(`/event/${token}/soon?title=${encodeURIComponent(data.title || eventName)}`);
        return;
      }
      
      // Check for private events (existing logic)
      if (data.is_private && (!data.published_at || new Date(data.published_at) > new Date())) {
        navigate(`/event/${token}/soon?title=${encodeURIComponent(data.title || eventName)}`);
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      {showHeader && (
        <Navbar compact fullBleed />
      )}
      
      {/* Header with cover image */}
      <header className="relative">
        <figure className="relative w-full mb-3 overflow-hidden bg-secondary rounded-none">
          <div className="relative h-[38vh] md:h-[48vh]">
            <img src={coverUrl || coverImg} alt={`غلاف ${title}`} className="absolute inset-0 h-full w-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
          </div>
        </figure>
      </header>
      <main className="container mx-auto px-4 py-4 flex-1 grid place-items-center">
        <section className="max-w-md mx-auto text-center">
          <h1 className="font-nastaliq text-4xl md:text-5xl leading-snug">ألبوم {title}</h1>
          <p className="mt-6 md:mt-7 text-muted-foreground">يسعدنا وجودكم — تفضّلوا للدخول إلى الألبوم.</p>
          <div className="mt-6">
            <Button
              className="rounded-full px-8"
              onClick={() => {
                if (token) sessionStorage.setItem(`intro_${token}`, "done");
                navigate(`/album/${token}`);
              }}
            >
              الدخول إلى الألبوم
            </Button>
          </div>
        </section>
      </main>
      {showHeader && (
        <Footer />
      )}
    </div>
  );
}
