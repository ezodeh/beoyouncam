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

export function PrivacyTab({ token, eventData, onEventUpdate }: PrivacyTabProps) {
  const { toast } = useToast();
  
  // Privacy settings
  const [isPrivate, setIsPrivate] = useState(eventData?.is_private ?? false);
  const [eventPassword, setEventPassword] = useState(eventData?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  
  
  // Welcome texts
  const [welcomeTitle, setWelcomeTitle] = useState(eventData?.welcome_title || "مرحباً بكم في مناسبتنا");
  const [welcomeText, setWelcomeText] = useState(eventData?.welcome_text || "شاركونا لحظاتكم الجميلة");
  const [inviteButtonText, setInviteButtonText] = useState(eventData?.invite_button_text || "انضم إلى المناسبة");

  const handleSave = async () => {
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

  return (
    <div className="space-y-6 text-right" dir="rtl">
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
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 ml-2" />
            حفظ إعدادات الخصوصية
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}