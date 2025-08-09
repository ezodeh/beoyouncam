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
      // Fetch participants only (photos and messages tables don't exist yet)
      const participantsRes = await supabase.from("participants").select("created_at").eq("event_token", token);
      
      const participants = participantsRes.data || [];
      const photos = Array(8).fill(null).map((_, i) => ({ created_at: new Date(Date.now() - i * 86400000).toISOString() })); // Dummy data
      const messages = Array(12).fill(null).map((_, i) => ({ created_at: new Date(Date.now() - i * 86400000).toISOString() })); // Dummy data

      // Calculate total stats
      setTotalStats({
        participants: participants.length,
        photos: photos.length,
        messages: messages.length,
        engagement: participants.length > 0 ? Math.round(((photos.length + messages.length) / participants.length) * 100) / 100 : 0
      });

      // Group by day for daily stats
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyData = last7Days.map(date => {
        const dayParticipants = participants.filter(p => p.created_at.startsWith(date)).length;
        const dayPhotos = photos.filter(p => p.created_at.startsWith(date)).length;
        const dayMessages = messages.filter(m => m.created_at.startsWith(date)).length;

        return {
          date: new Date(date).toLocaleDateString('ar-SA', { weekday: 'short' }),
          participants: dayParticipants,
          photos: dayPhotos,
          messages: dayMessages
        };
      });

      setDailyStats(dailyData);

      // Participation breakdown
      const participationBreakdown = [
        { name: 'مشاركين نشطين', value: Math.min(participants.length, photos.length + messages.length) },
        { name: 'مشاركين غير نشطين', value: Math.max(0, participants.length - (photos.length + messages.length)) }
      ];

      setParticipationData(participationBreakdown);

    } catch (error) {
      console.error("خطأ في تحميل الإحصائيات:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-3">
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
          <CardTitle>النشاط اليومي (آخر 7 أيام)</CardTitle>
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