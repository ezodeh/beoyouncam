import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateEventSettings } from "@/lib/eventSettings";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Mail, MessageCircle, Trash2, Shield, Lock, Unlock, Eye, EyeOff, Save } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  method: string;
  created_at: string;
}

interface ParticipantsTabProps {
  token: string;
  eventData: any;
  onEventUpdate: () => void;
}

export function ParticipantsTab({ token, eventData, onEventUpdate }: ParticipantsTabProps) {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Privacy settings
  const [isPrivate, setIsPrivate] = useState(eventData?.is_private ?? false);
  const [eventPassword, setEventPassword] = useState(eventData?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  
  // Welcome texts
  const [welcomeTitle, setWelcomeTitle] = useState(eventData?.welcome_title || "مرحباً بكم في مناسبتنا");
  const [welcomeText, setWelcomeText] = useState(eventData?.welcome_text || "شاركونا لحظاتكم الجميلة");
  const [inviteButtonText, setInviteButtonText] = useState(eventData?.invite_button_text || "انضم إلى المناسبة");

  useEffect(() => {
    fetchParticipants();
  }, [token]);

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("event_token", token)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      toast({
        title: "خطأ في تحميل المشاركين",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشارك؟")) return;

    try {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;

      setParticipants(prev => prev.filter(p => p.id !== participantId));
      toast({ title: "تم حذف المشارك بنجاح" });
    } catch (error) {
      toast({
        title: "فشل في حذف المشارك",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  const sendInvite = (participant: Participant) => {
    const eventUrl = `${window.location.origin}/event/${token}`;
    
    if (participant.email) {
      window.open(`mailto:${participant.email}?subject=دعوة للمشاركة في المناسبة&body=أهلاً ${participant.name}، مدعو للمشاركة في المناسبة: ${eventUrl}`);
    } else if (participant.phone) {
      window.open(`https://wa.me/${participant.phone}?text=أهلاً ${participant.name}، مدعو للمشاركة في المناسبة: ${eventUrl}`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settings = {
        is_private: isPrivate,
        password: eventPassword || null,
        welcome_title: welcomeTitle,
        welcome_text: welcomeText,
        invite_button_text: inviteButtonText,
      };

      const success = await updateEventSettings(token, settings);
      
      if (!success) throw new Error("فشل في حفظ الإعدادات");

      toast({ title: "تم حفظ إعدادات الخصوصية بنجاح" });
      onEventUpdate();
    } catch (error) {
      toast({ 
        title: "فشل في الحفظ", 
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>جاري تحميل المشاركين...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Guest Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Users className="h-5 w-5" />
            إحصائيات الحضور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="attendanceGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
                <Pie
                  data={[
                    { name: 'حضور', value: Math.min(participants.length, Number(eventData?.expected_guests ?? 100)) }, 
                    { name: 'متبق', value: Math.max(0, Number(eventData?.expected_guests ?? 100) - participants.length) }
                  ]}
                  dataKey="value"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                >
                  <Cell fill="url(#attendanceGrad)" />
                  <Cell fill="hsl(var(--muted-foreground) / 0.2)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold">
                  {String(participants.length).padStart(3, '0')}/{String(Number(eventData?.expected_guests ?? 100)).padStart(3, '0')}
                </div>
                <div className="text-sm text-muted-foreground">الحضور</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            المشاركون ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد مشاركون حتى الآن
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">التواصل</TableHead>
                  <TableHead className="text-right">طريقة الدخول</TableHead>
                  <TableHead className="text-right">تاريخ الانضمام</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">
                      {participant.name || "غير محدد"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {participant.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {participant.email}
                          </div>
                        )}
                        {participant.phone && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {participant.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{participant.method}</TableCell>
                    <TableCell>
                      {new Date(participant.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendInvite(participant)}
                        >
                          دعوة
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeParticipant(participant.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Shield className="h-5 w-5" />
            إعدادات الخصوصية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Private Event Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3 text-right">
              {isPrivate ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
              <div>
                <Label className="text-base">مناسبة خاصة</Label>
                <p className="text-sm text-muted-foreground">
                  {isPrivate ? "تحتاج كلمة سر للدخول" : "يمكن للجميع الانضمام"}
                </p>
              </div>
            </div>
            <Switch 
              checked={isPrivate} 
              onCheckedChange={setIsPrivate}
            />
          </div>

          {/* Password Field */}
          {isPrivate && (
            <div className="space-y-2">
              <Label htmlFor="password">كلمة السر</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={eventPassword}
                  onChange={(e) => setEventPassword(e.target.value)}
                  placeholder="أدخل كلمة السر للمناسبة"
                  className="pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Welcome Page Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <MessageCircle className="h-5 w-5" />
            تخصيص صفحة الترحيب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcomeTitle">عنوان الترحيب</Label>
            <Input
              id="welcomeTitle"
              value={welcomeTitle}
              onChange={(e) => setWelcomeTitle(e.target.value)}
              placeholder="مرحباً بكم في مناسبتنا"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeText">نص الترحيب</Label>
            <Textarea
              id="welcomeText"
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              placeholder="شاركونا لحظاتكم الجميلة"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteButtonText">نص زر الدعوة</Label>
            <Input
              id="inviteButtonText"
              value={inviteButtonText}
              onChange={(e) => setInviteButtonText(e.target.value)}
              placeholder="انضم إلى المناسبة"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={handleSaveSettings} className="w-full">
            <Save className="h-4 w-4 ml-2" />
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}