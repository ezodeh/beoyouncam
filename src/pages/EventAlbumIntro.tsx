import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function EventAlbumIntro() {
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "ألبومكم";
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>(eventName);
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const { toast } = useToast();
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
        .select("is_private, published_at, title, cover_url, show_header, owner_id, is_album_published, password")
        .eq("token", token)
        .maybeSingle();
        
      if (!data) return;
      
      setEventDetails(data);
      setTitle(data.title || eventName);
      setCoverUrl(data.cover_url || null);
      setShowHeader(data.show_header !== false);
      
      // Determine if current user is the event owner
      const currentIsEventOwner = session?.user?.id === data.owner_id;
      
      // Check if private album needs password verification
      if (data.is_private && data.password && !currentIsEventOwner) {
        const hasAccess = sessionStorage.getItem(`album_access_${token}`);
        if (!hasAccess) {
          setShowPasswordInput(true);
          return;
        }
      }
      
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

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast({
        title: "كلمة المرور مطلوبة",
        description: "يرجى إدخال كلمة المرور للوصول إلى الألبوم",
        variant: "destructive"
      });
      return;
    }

    if (eventDetails?.password === password.trim()) {
      sessionStorage.setItem(`album_access_${token}`, "granted");
      setShowPasswordInput(false);
      toast({
        title: "تم التحقق بنجاح"
      });
    } else {
      toast({
        title: "كلمة مرور خاطئة",
        description: "يرجى التحقق من كلمة المرور والمحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  };

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
        <section className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="font-nastaliq text-4xl md:text-5xl leading-snug">ألبوم {title}</h1>
            <p className="mt-6 md:mt-7 text-muted-foreground">
              {showPasswordInput 
                ? "يتطلب الوصول إلى هذا الألبوم كلمة مرور" 
                : "يسعدنا وجودكم — تفضّلوا للدخول إلى الألبوم."
              }
            </p>
          </div>

          {/* Password Input for Private Albums */}
          {showPasswordInput ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="album-password">كلمة المرور</Label>
                <Input
                  id="album-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="text-right"
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                />
              </div>
              <Button 
                className="w-full rounded-full" 
                onClick={handlePasswordSubmit}
                disabled={!password.trim()}
              >
                التحقق من كلمة المرور
              </Button>
            </div>
          ) : (
            <div className="mt-6">
              <Button
                className="w-full rounded-full px-8"
                onClick={() => {
                  if (token) sessionStorage.setItem(`intro_${token}`, "done");
                  navigate(`/album/${token}`);
                }}
              >
                الدخول إلى الألبوم
              </Button>
            </div>
          )}
        </section>
      </main>
      {showHeader && (
        <Footer />
      )}
    </div>
  );
}
