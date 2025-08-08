import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";

const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z
    .string()
    .regex(/^\+?\d{8,15}$/u, "رقم هاتف غير صالح"),
  email: z.string().email("بريد إلكتروني غير صالح"),
});

type FormData = z.infer<typeof schema>;

export default function EventFinalSubmit() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "تسليم الألبوم — من عيونكم";
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    // هنا يمكن إرسال القيم إلى الـ API لتخزين تفاصيل التسليم
    await new Promise((r) => setTimeout(r, 400));
    toast({ title: "تم التأكيد", description: "تم تسليم الألبوم بنجاح." });
    navigate(`/album/${token}/intro`);
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
