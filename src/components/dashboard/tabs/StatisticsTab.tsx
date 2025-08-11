import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Charts will be implemented later when recharts is properly configured
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, TrendingUp, Users, Camera } from "lucide-react";

interface StatisticsTabProps {
  token: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function StatisticsTab({ token }: StatisticsTabProps) {
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [participationData, setParticipationData] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({
    participants: 0,
    photos: 0,
    messages: 0,
    engagement: 0
  });

  useEffect(() => {
    fetchStatistics();
  }, [token]);

  const fetchStatistics = async () => {
    try {
      // Fetch real data from database
      const [participantsRes, blessingsRes, photosRes] = await Promise.all([
        supabase.from("participants").select("created_at").eq("event_token", token),
        supabase.from("blessings").select("created_at").eq("event_token", token),
        supabase.storage.from("event-media").list(`events/${token}`, { limit: 1000 })
      ]);
      
      const participants = participantsRes.data || [];
      const blessings = blessingsRes.data || [];
      const photos = photosRes.data?.filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) || [];

      // Calculate total stats
      setTotalStats({
        participants: participants.length,
        photos: photos.length,
        messages: blessings.length,
        engagement: participants.length > 0 ? Math.round(((photos.length + blessings.length) / participants.length) * 100) / 100 : 0
      });

      // Group by day for daily stats
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyData = last7Days.map(date => {
        const dayParticipants = participants.filter(p => p.created_at.startsWith(date)).length;
        const dayPhotos = photos.filter(p => {
          const photoDate = new Date(p.created_at || p.updated_at || '').toISOString().split('T')[0];
          return photoDate === date;
        }).length;
        const dayMessages = blessings.filter(m => m.created_at.startsWith(date)).length;

        return {
          date: new Date(date).toLocaleDateString('en-GB'),
          participants: dayParticipants,
          photos: dayPhotos,
          messages: dayMessages
        };
      });

      setDailyStats(dailyData);

      // Participation breakdown
      const activeParticipants = Math.min(participants.length, photos.length + blessings.length);
      const inactiveParticipants = Math.max(0, participants.length - activeParticipants);
      
      const participationBreakdown = [
        { name: 'مشاركين نشطين', value: activeParticipants },
        { name: 'مشاركين غير نشطين', value: inactiveParticipants }
      ];

      setParticipationData(participationBreakdown);

    } catch (error) {
      console.error("خطأ في تحميل الإحصائيات:", error);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-right">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalStats.participants}</div>
                <div className="text-xs text-muted-foreground">مشارك</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-right">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalStats.photos}</div>
                <div className="text-xs text-muted-foreground">صورة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-right">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalStats.messages}</div>
                <div className="text-xs text-muted-foreground">مباركة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-right">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalStats.engagement}</div>
                <div className="text-xs text-muted-foreground">متوسط المشاركة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">النشاط اليومي (آخر 7 أيام)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            ستتوفر الرسوم البيانية قريباً
          </div>
        </CardContent>
      </Card>
    </div>
  );
}