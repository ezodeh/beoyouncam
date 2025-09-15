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
      
      // First try to get public event info
      const { data, error } = await supabase
        .rpc("get_public_event_info", { event_token: token });
      
      console.log("Album intro event data:", data);
        
      if (!data || data.length === 0) return;
      
      const eventData = data[0]; // Get first item from array
      setEventDetails(eventData);
      setTitle(eventData.album_title || eventData.title || eventName);
      setCoverUrl(eventData.album_cover_url || eventData.cover_url || null);
      setShowHeader(eventData.show_header !== false);
      
      // For private events or detailed checks, we need additional data
      let isEventOwner = false;
      let eventPassword = null;
      let publishedAt = null;
      
      if (session?.user?.id) {
        // Check if user is event owner and get additional private info
        const { data: privateData } = await supabase
          .from("events")
          .select("owner_id, password, published_at")
          .eq("token", token)
          .maybeSingle();
          
        if (privateData) {
          isEventOwner = session.user.id === privateData.owner_id;
          eventPassword = privateData.password;
          publishedAt = privateData.published_at;
          // Store password in session for validation
          if (eventPassword) {
            sessionStorage.setItem(`event_password_${token}`, eventPassword);
          }
        }
      }
      // Check if private album needs password verification
      if (eventData.is_private && eventPassword && !isEventOwner) {
        const hasAccess = sessionStorage.getItem(`album_access_${token}`);
        if (!hasAccess) {
          setShowPasswordInput(true);
          return;
        }
      }
      
      console.log("🔍 Album Intro access check:", {
        isAlbumPublished: eventData.is_album_published,
        isEventOwner: isEventOwner,
        userId: session?.user?.id
      });
      
      // Check if album is published OR user is the owner
      if (!eventData.is_album_published && !isEventOwner) {
        console.log("🚫 Album not published and user is not owner, redirecting to soon page");
        navigate(`/event/${token}/soon?title=${encodeURIComponent(eventData.title || eventName)}`);
        return;
      }
      
      // Check for private events (existing logic)
      if (eventData.is_private && publishedAt && new Date(publishedAt) > new Date()) {
        navigate(`/event/${token}/soon?title=${encodeURIComponent(eventData.title || eventName)}`);
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

    // Check password against stored value in state  
    const { data: eventData } = await supabase
      .rpc("validate_event_password", { 
        event_token: token, 
        provided_password: password.trim() 
      });
    
    if (eventData) {
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
                : (eventDetails?.album_description || "يسعدنا وجودكم — تفضّلوا للدخول إلى الألبوم.")
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
