import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, QrCode, Users, Image, Share2, ExternalLink, Camera } from "lucide-react";
import QRCode from "react-qr-code";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRDesigner from "@/components/dashboard/QRDesigner";

interface OverviewTabProps {
  token: string;
  eventData: any;
}

export function OverviewTab({ token, eventData }: OverviewTabProps) {
  const [stats, setStats] = useState({ participants: 0, photos: 0, messages: 0 });
  const [countdown, setCountdown] = useState("");
  const [designerOpen, setDesignerOpen] = useState(false);
  const eventStatus = useMemo(() => {
    const now = Date.now();
    const start = eventData?.start_at ? new Date(eventData.start_at).getTime() : null;
    const end = eventData?.end_at ? new Date(eventData.end_at).getTime() : null;
    if (start && now < start) return "قادمة";
    if (start && (!end || now <= end) && now >= start) return "جارية";
    if (end && now > end) return "منتهية";
    return "غير محددة";
  }, [eventData?.start_at, eventData?.end_at]);

  useEffect(() => {
    // Fetch stats
    const fetchStats = async () => {
      const participantsRes = await supabase.from("participants").select("*", { count: 'exact' }).eq("event_token", token);

      setStats({
        participants: participantsRes.count || 0,
        photos: 8, // Dummy data
        messages: 12 // Dummy data
      });
    };

    fetchStats();
  }, [token]);

  useEffect(() => {
    // Update countdown
    const updateCountdown = () => {
      if (!eventData?.start_at) return;
      
      const now = new Date().getTime();
      const eventTime = new Date(eventData.start_at).getTime();
      const distance = eventTime - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        setCountdown(`${days} يوم، ${hours} ساعة، ${minutes} دقيقة`);
      } else {
        setCountdown("المناسبة جارية الآن!");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [eventData?.start_at]);

  const eventUrl = `${window.location.origin}/event/${token}`;

  return (
    <div className="grid gap-4 text-right">
      {/* Cover with overlay actions */}
      <Card className="relative overflow-hidden rounded-xl">
        <div
          className="h-[150px] w-full"
          style={{
            backgroundImage: eventData?.cover_url ? `url(${eventData.cover_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!eventData?.cover_url && (
            <div className="h-full w-full bg-muted" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <Link to={`/manage/${token}?tab=album`} className="rounded-full border px-1.5 py-[2px] text-[10px] bg-background/80 backdrop-blur">
            التحكم بالألبوم
          </Link>
          <Link to={`/album/${token}`} className="rounded-full border px-1.5 py-[2px] text-[10px] bg-background/80 backdrop-blur">
            تعديل شاشة الألبوم
          </Link>
          <Link to={`/manage/${token}?tab=details`} className="rounded-full border px-1.5 py-[2px] text-[10px] bg-background/80 backdrop-blur">
            تعديل شاشة الحدث
          </Link>
        </div>
        <div className="absolute inset-x-3 bottom-2 flex items-end justify-between gap-2">
          <div className="text-white">
            <h2 className="text-base font-bold font-nastaliq">{eventData?.title || "مناسبة جديدة"}</h2>
            {eventData?.start_at && (
              <div className="flex items-center gap-1 text-white/90">
                <Clock className="h-4 w-4" />
                <span className="text-[11px]">{countdown}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
      {/* Compact rows: Attendance + Status, then Dates */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">الحضور</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <Link to={`/manage/${token}?tab=participants`} className="relative block h-28 cursor-pointer">
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="attendanceGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[{ name: 'حضور', value: Math.min(stats.participants, Number(eventData?.expected_guests ?? 100)) }, { name: 'متبق', value: Math.max(0, Number(eventData?.expected_guests ?? 100) - stats.participants) }]}
                      dataKey="value"
                      innerRadius={36}
                      outerRadius={46}
                      paddingAngle={2}
                    >
                      <Cell fill="url(#attendanceGrad)" />
                      <Cell fill="hsl(var(--muted-foreground) / 0.2)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {String(stats.participants).padStart(3, '0')}/{String(Number(eventData?.expected_guests ?? 100)).padStart(3, '0')}
                  </div>
                  <div className="text-[10px] text-muted-foreground">الحضور</div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">حالة المناسبة</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full border text-[11px]">
              {eventStatus}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              اللقطات المسموحة: <span className="text-foreground">{eventData?.max_shots || 120}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">تاريخ البداية</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1 text-[12px]">
            {eventData?.start_at ? new Date(eventData.start_at).toLocaleString('ar-SA') : '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">تاريخ الانتهاء</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1 text-[12px]">
            {eventData?.end_at ? new Date(eventData.end_at).toLocaleString('ar-SA') : '—'}
          </CardContent>
        </Card>
      </div>

      {/* Photos + Album link (same size & same icon style) */}
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/manage/${token}?tab=album`} className="block">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-base font-bold">{stats.photos}</div>
                  <div className="text-[11px] text-muted-foreground">عدد الذكريات</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/album/${token}`} className="block">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-base font-bold">عرض الألبوم</div>
                  <div className="text-[11px] text-muted-foreground">افتح الألبوم العام</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* QR then Quick Links (stacked for mobile) */}
      <div className="space-y-2">
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <QrCode className="h-5 w-5" />
              نشر الألبوم
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center p-3">
            <div className="bg-white p-2 rounded-lg inline-block mb-2">
              <div id="overview-qr-wrap">
                <QRCode id="overview-qr" value={eventUrl} size={72} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(eventUrl)}>نسخ الرابط</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const svg = document.querySelector<SVGSVGElement>("#overview-qr");
                if (!svg) return;
                const serializer = new XMLSerializer();
                const source = serializer.serializeToString(svg);
                const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `event-${token}-qr.svg`; a.click(); URL.revokeObjectURL(url);
              }}>تنزيل (SVG)</Button>
              <Button variant="outline" size="sm" onClick={() => setDesignerOpen(true)}>تصميم</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ExternalLink className="h-5 w-5" />
              روابط سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full flex items-center justify-between flex-row-reverse">
              <Link to={`/event/${token}/camera`}>
                <span className="text-sm">فتح الكاميرا</span>
                <Camera className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full flex items-center justify-between flex-row-reverse">
              <Link to={`/album/${token}`}>
                <span className="text-sm">عرض الألبوم</span>
                <Image className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full flex items-center justify-between flex-row-reverse">
              <Link to={`/event/${token}/invites`}>
                <span className="text-sm">إرسال دعوات</span>
                <Share2 className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}