import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Lock, Unlock, Mail, MessageCircle, Save, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateEventSettings } from "@/lib/eventSettings";
interface PrivacyTabProps {
  token: string;
  eventData: any;
  onEventUpdate: () => void;
}
export function PrivacyTab({
  token,
  eventData,
  onEventUpdate
}: PrivacyTabProps) {
  const {
    toast
  } = useToast();

  // Privacy settings
  const [isPrivate, setIsPrivate] = useState(eventData?.is_private ?? false);
  const [eventPassword, setEventPassword] = useState(eventData?.password || "");
  const [showPassword, setShowPassword] = useState(false);

  // Album sharing settings
  const [shareMethod, setShareMethod] = useState(eventData?.share_method || "email");
  const [albumPublishTime, setAlbumPublishTime] = useState(eventData?.album_publish_time || "after_event");
  const [customPublishDelay, setCustomPublishDelay] = useState(eventData?.custom_publish_delay || 24);

  // Welcome texts
  const [welcomeTitle, setWelcomeTitle] = useState(eventData?.welcome_title || "مرحباً بكم في مناسبتنا");
  const [welcomeText, setWelcomeText] = useState(eventData?.welcome_text || "شاركونا لحظاتكم الجميلة");
  const [inviteButtonText, setInviteButtonText] = useState(eventData?.invite_button_text || "انضم إلى المناسبة");
  const handleSave = async () => {
    try {
      const settings = {
        is_private: isPrivate,
        password: eventPassword || null,
        share_method: shareMethod,
        album_publish_time: albumPublishTime,
        custom_publish_delay: customPublishDelay,
        welcome_title: welcomeTitle,
        welcome_text: welcomeText,
        invite_button_text: inviteButtonText
      };
      const success = await updateEventSettings(token, settings);
      if (!success) throw new Error("فشل في حفظ الإعدادات");
      toast({
        title: "تم حفظ إعدادات الخصوصية بنجاح"
      });
      onEventUpdate();
    } catch (error) {
      toast({
        title: "فشل في الحفظ",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };
  return <div className="space-y-6" dir="rtl">
      {/* Privacy Settings */}
      

      {/* Album Publishing Settings */}
      <Card>
        <CardHeader>
          
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Share Method */}
          <div className="space-y-2">
            <Label htmlFor="shareMethod">طريقة المشاركة</Label>
            <Select value={shareMethod} onValueChange={setShareMethod}>
              <SelectTrigger>
                <SelectValue placeholder="اختر طريقة المشاركة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    البريد الإلكتروني
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    واتساب
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Album Publish Time */}
          <div className="space-y-2">
            <Label htmlFor="publishTime">وقت نشر الألبوم</Label>
            <Select value={albumPublishTime} onValueChange={setAlbumPublishTime}>
              <SelectTrigger>
                <SelectValue placeholder="اختر وقت النشر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediately">فوراً</SelectItem>
                <SelectItem value="after_event">بعد انتهاء المناسبة</SelectItem>
                <SelectItem value="after_12h">بعد 12 ساعة</SelectItem>
                <SelectItem value="after_24h">بعد 24 ساعة</SelectItem>
                <SelectItem value="custom">مخصص</SelectItem>
                <SelectItem value="manual">نشر يدوي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Delay */}
          {albumPublishTime === "custom" && <div className="space-y-2">
              <Label htmlFor="customDelay">عدد الساعات للتأخير</Label>
              <Input id="customDelay" type="number" min={1} max={168} value={customPublishDelay} onChange={e => setCustomPublishDelay(Number(e.target.value))} placeholder="عدد الساعات" />
            </div>}

          {albumPublishTime === "manual" && <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                النشر اليدوي: لن يظهر الألبوم للضيوف إلا عندما تختار نشره بنفسك من لوحة التحكم.
              </p>
            </div>}
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
            <Input id="welcomeTitle" value={welcomeTitle} onChange={e => setWelcomeTitle(e.target.value)} placeholder="مرحباً بكم في مناسبتنا" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeText">نص الترحيب</Label>
            <Textarea id="welcomeText" value={welcomeText} onChange={e => setWelcomeText(e.target.value)} placeholder="شاركونا لحظاتكم الجميلة" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteButtonText">نص زر الدعوة</Label>
            <Input id="inviteButtonText" value={inviteButtonText} onChange={e => setInviteButtonText(e.target.value)} placeholder="انضم إلى المناسبة" />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 ml-2" />
            حفظ إعدادات الخصوصية
          </Button>
        </CardContent>
      </Card>
    </div>;
}