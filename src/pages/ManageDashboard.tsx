import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ManageDashboard = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [maxShots, setMaxShots] = useState<number>(20);

  useEffect(() => {
    document.title = "إدارة المناسبة — من عيونكم";
  }, []);

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("title, description, start_at, end_at, max_shots")
        .eq("token", token as string)
        .maybeSingle();
      if (data) {
        setTitle((data as any).title || "");
        setDescription((data as any).description || "");
        setStartAt((data as any).start_at || "");
        setEndAt((data as any).end_at || "");
        setMaxShots(typeof (data as any).max_shots === "number" ? (data as any).max_shots : 20);
      }
      setLoading(false);
    })();
  }, [token]);

  async function save() {
    if (!token) return;
    const { error } = await supabase
      .from("events")
      .update({
        title: title.trim() || null,
        description: description.trim() || null,
        start_at: startAt ? new Date(startAt).toISOString() : null,
        end_at: endAt ? new Date(endAt).toISOString() : null,
        max_shots: Math.max(1, Number(maxShots) || 1),
      })
      .eq("token", token as string);
    if (error) alert("فشل الحفظ: " + error.message);
    else alert("تم الحفظ");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar compact />
      <main className="flex-1 container mx-auto py-12 grid gap-6">
        <div>
          <h1 className="text-3xl font-extrabold">لوحة التحكم</h1>
          <p className="text-muted-foreground">رمز الإدارة: {token}</p>
        </div>

        <Card>
          <CardHeader><CardTitle>إعدادات المناسبة</CardTitle></CardHeader>
          <CardContent className="grid gap-4 max-w-2xl">
            {loading ? (
              <div>جاري التحميل…</div>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <Label>اسم المناسبة</Label>
                  <Input value={title} onChange={(e)=> setTitle(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>الوصف</Label>
                  <Textarea value={description} onChange={(e)=> setDescription(e.target.value)} rows={3} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label>وقت البداية</Label>
                    <Input type="datetime-local" value={startAt ? startAt.slice(0,16) : ""} onChange={(e)=> setStartAt(e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>وقت الانتهاء</Label>
                    <Input type="datetime-local" value={endAt ? endAt.slice(0,16) : ""} onChange={(e)=> setEndAt(e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>عدد اللقطات</Label>
                    <Input type="number" min={1} value={maxShots} onChange={(e)=> setMaxShots(Number(e.target.value))} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={save} className="rounded-full">حفظ</Button>
                  <Button variant="outline" className="rounded-full" onClick={()=> window.open(`/event/${token}/invites`, "_blank")}>دعوة الضيوف</Button>
                  <Button variant="outline" className="rounded-full" onClick={()=> window.open(`/album/${token}`, "_blank")}>عرض الألبوم</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>الخطة والترقية</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">يمكنك ترقية خطتك لزيادة عدد الضيوف أو فتح مزايا إضافية.</p>
            <Button variant="hero" className="rounded-full" onClick={()=> window.location.href = "/choose-plan"}>ترقية الخطة</Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ManageDashboard;
