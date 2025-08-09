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
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().regex(/^\+?\d{8,15}$/u, "رقم هاتف غير صالح"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  blessing: z.string().min(4, "اكتب مباركتك").max(500, "كلام كثير شوي")
});

type FormData = z.infer<typeof schema>;

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
  const { toast } = useToast();
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);

  useEffect(() => {
    document.title = "تسليم الألبوم — عيون cam";
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      blessing: defaultBlessings[Math.floor(Math.random() * defaultBlessings.length)]
    }
  });

  // Auto-fill user data if logged in
  useEffect(() => {
    if (isUserDataLoaded) return;
    
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userData = session.user;
          const fullName = userData.user_metadata?.full_name || userData.user_metadata?.name || "";
          const userEmail = userData.email || "";
          const userPhone = userData.user_metadata?.phone || userData.phone || "";
          
          if (fullName) setValue("name", fullName);
          if (userEmail) setValue("email", userEmail);
          if (userPhone) setValue("phone", userPhone);
        }
        
        // Check if participant exists for this event to get stored data
        const storedName = localStorage.getItem(`participantName:${token}`);
        if (storedName && !session?.user?.user_metadata?.full_name) {
          setValue("name", storedName);
        }
        
        setIsUserDataLoaded(true);
      } catch (error) {
        console.error("Error loading user data:", error);
        setIsUserDataLoaded(true);
      }
    })();
  }, [setValue, token, isUserDataLoaded]);

  async function onSubmit(values: FormData) {
    // هنا يمكن إرسال القيم إلى الـ API لتخزين تفاصيل التسليم
    await new Promise((r) => setTimeout(r, 400));
    // Save blessing to database
    try {
      await supabase.from("blessings").insert({
        event_token: token,
        name: values.name,
        content: values.blessing
      });
    } catch (error) {
      console.error("Error saving blessing:", error);
    }
    navigate(`/event/${token}/submit-success${window.location.search}`);
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

                <div className="grid gap-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input id="phone" inputMode="tel" {...register("phone")} placeholder="مثال: +9627xxxxxxxx" />
                  {errors.phone && (
                    <span className="text-sm text-destructive">{errors.phone.message}</span>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" inputMode="email" {...register("email")} placeholder="name@example.com" />
                  {errors.email && (
                    <span className="text-sm text-destructive">{errors.email.message}</span>
                  )}
                </div>

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
                  <Link to={`/event/${token}/camera`} className="underline hover:no-underline">
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
