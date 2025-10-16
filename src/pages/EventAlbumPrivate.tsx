import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Lock } from "lucide-react";

export default function EventAlbumPrivate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventTitle, setEventTitle] = useState("الألبوم");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    document.title = `دخول الألبوم الخاص — ${eventTitle} — من عيونكم`;
  }, [eventTitle]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const { data } = await supabase
          .from("events")
          .select("title, is_private, password, cover_url")
          .eq("token", token)
          .maybeSingle();
        
        if (data) {
          setEventTitle(data.title || "الألبوم");
          setCoverUrl(data.cover_url || null);
          
          // If not private, redirect to regular album
          if (!data.is_private) {
            navigate(`/album/${token}${location.search}`);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    })();
  }, [token, navigate, location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({
        title: "كلمة المرور مطلوبة",
        description: "يرجى إدخال كلمة المرور للوصول إلى الألبوم",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Use secure password verification function
      const { data, error } = await supabase.rpc('verify_event_password', {
        event_token_param: token,
        password_param: password.trim()
      });
      
      if (error) {
        console.error("Password verification error:", error);
        toast({
          title: "خطأ في التحقق",
          description: "حدث خطأ أثناء التحقق من كلمة المرور",
          variant: "destructive"
        });
        return;
      }
      
      if (data === true) {
        // Store access permission
        sessionStorage.setItem(`album_access_${token}`, "granted");
        navigate(`/album/${token}${location.search}`);
      } else {
        toast({
          title: "كلمة مرور خاطئة",
          description: "يرجى التحقق من كلمة المرور والمحاولة مرة أخرى",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Password verification exception:", error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء التحقق من كلمة المرور",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 grid place-items-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {coverUrl && (
              <div className="mx-auto w-20 h-20 mb-4 overflow-hidden rounded-full">
                <img 
                  src={coverUrl} 
                  alt={`غلاف ${eventTitle}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {!coverUrl && (
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            )}
            <CardTitle className="font-nastaliq text-2xl">ألبوم {eventTitle}</CardTitle>
            <p className="text-muted-foreground text-sm mt-3">
              يتطلب هذا الألبوم كلمة مرور للوصول
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-right block mb-1">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="text-right"
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !password.trim()}
              >
                {loading ? "جاري التحقق..." : "دخول الألبوم"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}