import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getEventSettings } from "@/lib/eventSettings";

// Dynamic schema creator based on event settings
const createSchema = (shareMethod?: "email" | "whatsapp", hasAutoPublish?: boolean) => {
  const baseSchema = {
    name: z.string().min(2, "الاسم مطلوب"),
    blessing: z.string().min(4, "اكتب مباركتك").max(500, "كلام كثير شوي")
  };

  // If auto publish is not enabled, default to email
  if (!hasAutoPublish) {
    return z.object({
      ...baseSchema,
      email: z.string().email("بريد إلكتروني غير صالح")
    });
  }

  // If auto publish is enabled, collect based on share method
  if (shareMethod === "email") {
    return z.object({
      ...baseSchema,
      email: z.string().email("بريد إلكتروني غير صالح")
    });
  } else {
    return z.object({
      ...baseSchema,
      phone: z.string().regex(/^\+?\d{8,15}$/u, "رقم هاتف غير صالح")
    });
  }
};

type FormData = {
  name: string;
  blessing: string;
  phone?: string;
  email?: string;
};

// Default congratulations messages
const defaultBlessings = [
  "مبروك وألف مبروك! 🎉",
  "بارك الله لكم في هذه المناسبة السعيدة 💙",
  "أجمل التهاني والتبريكات ❤️",
  "كل عام وأنتم بخير وسعادة 🌟",
  "تهانينا القلبية لكم في هذا اليوم المميز 🎊",
  "أطيب التمنيات بالسعادة والتوفيق 🌹"
];

export default function EventFinalSubmit() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const [eventSettings, setEventSettings] = useState<{
    share_method?: "email" | "whatsapp";
    album_publish_time?: string;
  } | null>(null);

  useEffect(() => {
    document.title = "تسليم الألبوم — عيون cam";
    
    // Load event settings to determine form requirements
    (async () => {
      if (!token) return;
      try {
        const settings = await getEventSettings(token);
        if (settings) {
          setEventSettings({
            share_method: settings.share_method,
            album_publish_time: settings.album_publish_time
          });
        }
      } catch (error) {
        console.error("Error loading event settings:", error);
      }
    })();
  }, [token]);

  // Determine if auto publish is enabled
  const hasAutoPublish = eventSettings?.album_publish_time !== undefined && eventSettings.album_publish_time !== "manual";
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ 
    resolver: zodResolver(createSchema(eventSettings?.share_method, hasAutoPublish)),
    defaultValues: {
      blessing: defaultBlessings[Math.floor(Math.random() * defaultBlessings.length)]
    }
  });

  // Auto-fill user data - prioritize participant data over other sources
  useEffect(() => {
    if (isUserDataLoaded) return;
    
    (async () => {
      try {
        // Read greeting from URL parameters
        const urlParams = new URLSearchParams(location.search);
        const greetingFromUrl = urlParams.get('greeting');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        let participantData = null;
        
        // First priority: Get participant data from database (most accurate)
        if (session?.user) {
          // Check if user is already a participant
          const { data: participant } = await supabase
            .from("participants")
            .select("name, phone, email, country_code")
            .eq("event_token", token)
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          participantData = participant;
        } else {
          // For anonymous users, try to get participant by stored participant ID
          const storedParticipantId = localStorage.getItem(`participantId:${token}`);
          if (storedParticipantId) {
            const { data: participant } = await supabase
              .from("participants")
              .select("name, phone, email, country_code")
              .eq("id", storedParticipantId)
              .maybeSingle();
            
            participantData = participant;
          }
        }
        
        // Auto-fill with participant data (highest priority)
        if (participantData) {
          console.log("📱 Using participant data:", participantData);
          
          if (participantData.name) {
            setValue("name", participantData.name);
          }
          
          if (participantData.phone) {
            // Format phone number with country code if available
            const fullPhone = participantData.country_code ? 
              `${participantData.country_code}${participantData.phone}` : 
              participantData.phone;
            setValue("phone", fullPhone);
            console.log("📱 Auto-filled phone:", fullPhone);
          }
          
          if (participantData.email) {
            setValue("email", participantData.email);
          }
        } 
        // Fallback: Use authenticated user data if no participant data
        else if (session?.user) {
          const userData = session.user;
          console.log("📱 Fallback to user data:", userData);
          
          const fullName = userData.user_metadata?.full_name || userData.user_metadata?.name || "";
          const userEmail = userData.email || "";
          
          if (fullName) setValue("name", fullName);
          if (userEmail) setValue("email", userEmail);
          
          // Check profile table for phone number if not in participant data
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("phone, display_name")
              .eq("id", session.user.id)
              .maybeSingle();
            
            if (profile?.phone) {
              setValue("phone", profile.phone);
              console.log("📱 Using profile phone:", profile.phone);
            }
            if (profile?.display_name && !fullName) {
              setValue("name", profile.display_name);
            }
          } catch (error) {
            console.log("Error fetching profile:", error);
          }
        }
        // Last fallback: localStorage data for anonymous users
        else {
          const storedName = localStorage.getItem(`participantName:${token}`);
          if (storedName) {
            setValue("name", storedName);
          }
        }
        
        // Set greeting from URL if provided, otherwise use default
        if (greetingFromUrl) {
          console.log("📝 Setting greeting from URL:", greetingFromUrl);
          setValue("blessing", greetingFromUrl);
        }
        
        setIsUserDataLoaded(true);
      } catch (error) {
        console.error("Error loading user data:", error);
        setIsUserDataLoaded(true);
      }
    })();
  }, [setValue, token, isUserDataLoaded, location.search]);

  async function onSubmit(values: FormData) {
    try {
      setIsUserDataLoaded(false);
      
      // Save phone to profile if user is logged in and phone wasn't previously saved
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && values.phone) {
        try {
          await supabase
            .from("profiles")
            .upsert({
              id: session.user.id,
              phone: values.phone,
              display_name: values.name,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });
        } catch (error) {
          console.log("Error saving profile:", error);
        }
      }
      
      await new Promise((r) => setTimeout(r, 400));
      
      // Save blessing to database
      await supabase.from("blessings").insert({
        event_token: token,
        name: values.name,
        content: values.blessing
      });
      
      navigate(`/event/${token}/submit-success${window.location.search}`);
    } catch (error) {
      console.error("Error submitting:", error);
      toast({
        title: "حدث خطأ",
        description: "حاول مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsUserDataLoaded(true);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mx-auto w-full max-w-md">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-center">تأكيد بيانات التسليم</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 text-center">رمز المناسبة: {token}</p>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input id="name" {...register("name")} placeholder="اكتب اسمك" />
                  {errors.name && (
                    <span className="text-sm text-destructive">{errors.name.message}</span>
                  )}
                </div>

                {/* Conditional form fields based on auto publish settings */}
                {(!hasAutoPublish || eventSettings?.share_method === "email") && (
                  <div className="grid gap-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" type="email" inputMode="email" {...register("email")} placeholder="name@example.com" />
                    {errors.email && (
                      <span className="text-sm text-destructive">{errors.email.message}</span>
                    )}
                  </div>
                )}

                {(hasAutoPublish && eventSettings?.share_method === "whatsapp") && (
                  <div className="grid gap-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input id="phone" inputMode="tel" {...register("phone")} placeholder="مثال: +9627xxxxxxxx" />
                    {errors.phone && (
                      <span className="text-sm text-destructive">{errors.phone.message}</span>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="blessing">مباركتك للحفل</Label>
                  <Input id="blessing" {...register("blessing")} placeholder="اكتب كلماتك الجميلة" />
                  {errors.blessing && (
                    <span className="text-sm text-destructive">{errors.blessing.message}</span>
                  )}
                </div>

                <Button type="submit" size="lg" className="rounded-full" disabled={isSubmitting}>
                  {isSubmitting ? "جارٍ التأكيد…" : "تسليم الألبوم نهائيًا"}
                </Button>

                <div className="text-center text-sm">
                  <Link to={`/event/${token}/camera${window.location.search}`} className="underline hover:no-underline">
                    الرجوع إلى شاشة الكاميرا
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
