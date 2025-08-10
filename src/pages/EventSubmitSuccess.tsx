import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Check, Album, Camera, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function EventSubmitSuccess() {
  const { token } = useParams();
  const location = useLocation();
  const [eventName, setEventName] = useState<string>("مناسبتكم");
  const [isAlbumPublished, setIsAlbumPublished] = useState<boolean>(false);
  const [participantName, setParticipantName] = useState<string>("");

  useEffect(() => {
    document.title = "تم التسليم بنجاح — عيون cam";
    loadEventData();
    getParticipantName();
  }, [token]);

  const loadEventData = async () => {
    if (!token) return;
    
    const { data } = await supabase
      .from("events")
      .select("title, is_album_published")
      .eq("token", token)
      .maybeSingle();
    
    if (data) {
      setEventName(data.title || "مناسبتكم");
      setIsAlbumPublished(data.is_album_published || false);
    }
  };

  const getParticipantName = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      
      if (profile?.display_name) {
        setParticipantName(profile.display_name);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 grid place-items-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">
              تم التسليم بنجاح! ✅
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              تم تسليم ألبومك بنجاح وحفظ بياناتك. شكراً لمشاركتكم في {eventName}!
            </p>
            
            <div className="space-y-3">
              {isAlbumPublished ? (
                <Button asChild className="w-full" size="lg">
                  <Link to={`/album/${token}/intro`}>
                    <Album className="h-5 w-5 ml-2" />
                    عرض الألبوم النهائي
                  </Link>
                </Button>
              ) : participantName && (
                <Button asChild className="w-full" size="lg">
                  <Link to={`/album/${token}/by/${encodeURIComponent(participantName)}`}>
                    <User className="h-5 w-5 ml-2" />
                    عرض الألبوم الشخصي
                  </Link>
                </Button>
              )}
              
              <Button asChild variant="outline" className="w-full">
                <Link to={`/event/${token}/camera`}>
                  <Camera className="h-5 w-5 ml-2" />
                  العودة للكاميرا
                </Link>
              </Button>
              
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">
                  العودة للصفحة الرئيسية
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}