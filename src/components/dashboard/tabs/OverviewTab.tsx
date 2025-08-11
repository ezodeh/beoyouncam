import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, QrCode, Users, Album, Share2, ExternalLink, Camera, Images, X, Maximize } from "lucide-react";
import QRCode from "react-qr-code";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRDesigner from "@/components/dashboard/QRDesigner";
import { formatDate } from "@/lib/dateUtils";
import heroImage from "@/assets/hero-mnaoyonkom.jpg";

interface OverviewTabProps {
  token: string;
  eventData: any;
}

export function OverviewTab({ token, eventData }: OverviewTabProps) {
  const [stats, setStats] = useState({ participants: 0, photos: 0, messages: 0 });
  const [countdown, setCountdown] = useState("");
  const [enlargedQR, setEnlargedQR] = useState<{ url: string; title: string } | null>(null);
  const [fullscreenQR, setFullscreenQR] = useState(false);
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
    // Fetch real stats
    const fetchStats = async () => {
      const [participantsRes, blessingsRes, photosRes] = await Promise.all([
        supabase.from("participants").select("*", { count: 'exact' }).eq("event_token", token),
        supabase.from("blessings").select("*", { count: 'exact' }).eq("event_token", token),
        supabase.storage.from("event-media").list(`events/${token}`, { limit: 1000 })
      ]);

      const photoCount = photosRes.data?.filter(file => 
        file.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i)
      ).length || 0;

      setStats({
        participants: participantsRes.count || 0,
        photos: photoCount,
        messages: blessingsRes.count || 0
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

  const eventUrl = `${window.location.origin}/event/${token}/welcome`;

  const closeAllDialogs = () => {
    setEnlargedQR(null);
    setFullscreenQR(false);
  };

  return (
    <div className="grid gap-4 text-right" dir="rtl">
      {/* Cover with overlay actions */}
      <Card className="relative overflow-hidden rounded-xl">
        <div
          className="h-[150px] w-full"
          style={{
            backgroundImage: `url(${eventData?.cover_url || heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute inset-x-3 bottom-2 flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-xl font-bold font-nastaliq">{eventData?.title || "مناسبة جديدة"}</h2>
            {eventData?.start_at && (
              <div className="flex items-center justify-center gap-1 text-white/90 mt-1">
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
            {eventData?.start_at ? new Date(eventData.start_at).toLocaleDateString('en-GB') + ' ' + new Date(eventData.start_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">تاريخ الانتهاء</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1 text-[12px]">
            {eventData?.end_at ? new Date(eventData.end_at).toLocaleDateString('en-GB') + ' ' + new Date(eventData.end_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </CardContent>
        </Card>
      </div>

      {/* Photos + Album link (same size & same icon style) */}
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/manage/${token}?tab=album`} className="block">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-row-reverse">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Images className="h-5 w-5 text-primary" />
                </div>
                <div className="text-right">
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
              <div className="flex items-center gap-2 flex-row-reverse">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Album className="h-5 w-5 text-primary" />
                </div>
                <div className="text-right">
                  <div className="text-base font-bold">الألبوم</div>
                  <div className="text-[11px] text-muted-foreground">عرض الالبوم الان</div>
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
            <CardTitle className="flex items-center justify-start gap-2 text-sm">
              <QrCode className="h-5 w-5" />
              {eventStatus === "منتهية" ? "الألبوم" : "نشر الحدث"}
              {eventData?.published_at && new Date(eventData.published_at) > new Date() && eventStatus !== "منتهية" && (
                <span className="text-xs text-muted-foreground block">
                  سيُنشر بعد: {Math.ceil((new Date(eventData.published_at).getTime() - Date.now()) / (1000 * 60 * 60))} ساعة
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center p-3">
            {eventStatus === "منتهية" ? (
              // Show album link when event is ended
              <div className="space-y-3">
                <div 
                  className="bg-white p-2 rounded-lg inline-block cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setEnlargedQR({ url: `${window.location.origin}/album/${token}`, title: "باركود الألبوم" })}
                >
                  <div id="overview-qr-wrap">
                    <QRCode id="overview-qr" value={`${window.location.origin}/album/${token}`} size={72} level="H" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/album/${token}`)}>نسخ الرابط</Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const svg = document.querySelector<SVGSVGElement>("#overview-qr");
                    if (!svg) return;
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    const scale = 4;
                    const size = 512;
                    canvas.width = size * scale;
                    canvas.height = size * scale;
                    ctx.scale(scale, scale);
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                    const url = URL.createObjectURL(svgBlob);
                    const img = document.createElement("img");
                    img.onload = () => {
                      ctx.fillStyle = "#ffffff";
                      ctx.fillRect(0, 0, size, size);
                      ctx.drawImage(img, 0, 0, size, size);
                      canvas.toBlob((pngBlob) => {
                        if (pngBlob) {
                          const pngUrl = URL.createObjectURL(pngBlob);
                          const a = document.createElement("a");
                          a.href = pngUrl; a.download = `album-${token}-qr.png`; a.click();
                          URL.revokeObjectURL(pngUrl);
                        }
                      }, "image/png", 1.0);
                      URL.revokeObjectURL(url);
                    };
                    img.src = url;
                  }}>تنزيل PNG</Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    const url = `${window.location.origin}/album/${token}`;
                    if (navigator.share) {
                      await navigator.share({ title: 'ألبوم المناسبة', url });
                    } else {
                      navigator.clipboard.writeText(url);
                    }
                  }}>مشاركة</Button>
                </div>
              </div>
            ) : (
              // Show event link and camera when event is active or upcoming
              <div className="space-y-3">
                <div 
                  className="bg-white p-2 rounded-lg inline-block cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setEnlargedQR({ url: eventUrl, title: "باركود المناسبة" })}
                >
                  <div id="overview-qr-wrap">
                    <QRCode id="overview-qr" value={eventUrl} size={72} level="H" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(eventUrl)}>نسخ الرابط</Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const svg = document.querySelector<SVGSVGElement>("#overview-qr");
                    if (!svg) return;
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    const scale = 4;
                    const size = 512;
                    canvas.width = size * scale;
                    canvas.height = size * scale;
                    ctx.scale(scale, scale);
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                    const url = URL.createObjectURL(svgBlob);
                    const img = document.createElement("img");
                    img.onload = () => {
                      ctx.fillStyle = "#ffffff";
                      ctx.fillRect(0, 0, size, size);
                      ctx.drawImage(img, 0, 0, size, size);
                      canvas.toBlob((pngBlob) => {
                        if (pngBlob) {
                          const pngUrl = URL.createObjectURL(pngBlob);
                          const a = document.createElement("a");
                          a.href = pngUrl; a.download = `event-${token}-qr.png`; a.click();
                          URL.revokeObjectURL(pngUrl);
                        }
                      }, "image/png", 1.0);
                      URL.revokeObjectURL(url);
                    };
                    img.src = url;
                  }}>تنزيل PNG</Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    if (navigator.share) {
                      await navigator.share({ title: 'نشر الحدث', url: eventUrl });
                    } else {
                      navigator.clipboard.writeText(eventUrl);
                    }
                  }}>مشاركة</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="flex items-center gap-2 text-sm flex-row-reverse">
              <ExternalLink className="h-5 w-5" />
              روابط سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full flex items-center justify-between flex-row-reverse">
              <Link to={`/event/${token}/camera`}>
                <Camera className="h-5 w-5 mr-2" />
                <span className="text-sm">فتح الكاميرا</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full flex items-center justify-between flex-row-reverse">
              <Link to={`/album/${token}`}>
                <Images className="h-5 w-5 mr-2" />
                <span className="text-sm">عرض الألبوم</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full flex items-center justify-between flex-row-reverse">
              <Link to={`/event/${token}/invites`}>
                <Share2 className="h-5 w-5 mr-2" />
                <span className="text-sm">إرسال دعوات</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Enlarged QR Dialog */}
      <Dialog open={!!enlargedQR} onOpenChange={() => setEnlargedQR(null)}>
        <DialogContent className={`${fullscreenQR ? 'max-w-full h-screen' : 'max-w-md'} p-8`}>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEnlargedQR(null)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-lg font-semibold">
              {enlargedQR?.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreenQR(!fullscreenQR)}
              className="h-8 w-8 p-0"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg inline-block border shadow-sm">
              {enlargedQR && (
                <QRCode value={enlargedQR.url} size={fullscreenQR ? 400 : 280} level="H" />
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              اضغط على الباركود أو استخدم كاميرا الهاتف لمسحه
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}