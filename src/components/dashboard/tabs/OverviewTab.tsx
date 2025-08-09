import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, QrCode, Users, Image, Share2, ExternalLink } from "lucide-react";
import QRCode from "react-qr-code";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface OverviewTabProps {
  token: string;
  eventData: any;
}

export function OverviewTab({ token, eventData }: OverviewTabProps) {
  const [stats, setStats] = useState({ participants: 0, photos: 0, messages: 0 });
  const [countdown, setCountdown] = useState("");

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
    <div className="grid gap-6">
      {/* Event Status & Countdown */}
      <Card className="bg-brand-gradient text-brand-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{eventData?.title || "مناسبة جديدة"}</h2>
              {eventData?.start_at && (
                <div className="flex items-center gap-2 text-white/90">
                  <Clock className="h-4 w-4" />
                  <span>{countdown}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.participants}</div>
              <div className="text-white/90 text-sm">مشارك</div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Attendance Donut */}
      <Card>
        <CardHeader>
          <CardTitle>الحضور</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="relative h-48">
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
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    <Cell fill="url(#attendanceGrad)" />
                    <Cell fill="hsl(var(--muted-foreground) / 0.2)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {String(stats.participants).padStart(3, '0')}/{String(Number(eventData?.expected_guests ?? 100)).padStart(3, '0')}
                  </div>
                  <div className="text-xs text-muted-foreground">الحضور</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }} />
                <span className="text-sm">الحاضرين</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-muted-foreground/20" />
                <span className="text-sm">المتبقي</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Image className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.photos}</div>
                <div className="text-sm text-muted-foreground">صورة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.messages}</div>
                <div className="text-sm text-muted-foreground">مباركة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{eventData?.max_shots || 120}</div>
                <div className="text-sm text-muted-foreground">صورة مسموحة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code & Links */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR كود المناسبة
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <QRCode value={eventUrl} size={120} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              اعرض هذا الرمز للضيوف للدخول المباشر
            </p>
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(eventUrl);
            }}>
              نسخ الرابط
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              روابط سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to={`/event/${token}/invites`}>
                <Share2 className="h-4 w-4 mr-2" />
                إرسال دعوات
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to={`/album/${token}`}>
                <Image className="h-4 w-4 mr-2" />
                عرض الألبوم
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to={`/event/${token}/camera`}>
                <Users className="h-4 w-4 mr-2" />
                فتح الكاميرا
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}