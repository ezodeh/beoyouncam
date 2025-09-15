import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Save, Video, Lock, Unlock, Globe, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateEventSettings, getSupportedCountries } from "@/lib/eventSettings";
interface EventDetailsTabProps {
  token: string;
  eventData: any;
  onEventUpdate: () => void;
}
export function EventDetailsTab({
  token,
  eventData,
  onEventUpdate
}: EventDetailsTabProps) {
  const {
    toast
  } = useToast();
  
  // Check if event is past/expired
  const isEventExpired = eventData?.end_at ? new Date(eventData.end_at) < new Date() : false;
  
  const [title, setTitle] = useState(eventData?.title || "");
  const [description, setDescription] = useState(eventData?.description || "");
  const [startAt, setStartAt] = useState(eventData?.start_at ? eventData.start_at.slice(0, 16) : "");
  const [endAt, setEndAt] = useState(eventData?.end_at ? eventData.end_at.slice(0, 16) : "");
  const [maxShots, setMaxShots] = useState(eventData?.max_shots || 120);
  const [expectedGuests, setExpectedGuests] = useState<number>(eventData?.expected_guests ?? 100);
  const [showCustomGuestInput, setShowCustomGuestInput] = useState(false);
  const [coverUrl, setCoverUrl] = useState(eventData?.cover_url || "");
  const [enableVideo, setEnableVideo] = useState(eventData?.enable_video ?? true);
  const [isPrivate, setIsPrivate] = useState(eventData?.is_private ?? false);
  const [password, setPassword] = useState(eventData?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState(eventData?.country_code || "+962");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `cover-${token}-${Date.now()}.${file.name.split('.').pop()}`;
      const {
        data,
        error
      } = await supabase.storage.from('event-media').upload(fileName, file);
      if (error) throw error;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('event-media').getPublicUrl(fileName);
      setCoverUrl(publicUrl);
      toast({
        title: "تم رفع الصورة بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ في رفع الصورة",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const handleSave = async () => {
    try {
      const settings: any = {
        title: title.trim() || "مناسبة جديدة",
        description: description.trim() || null,
        cover_url: coverUrl || null,
        is_private: isPrivate,
        password: isPrivate ? password.trim() || null : null,
        country_code: countryCode
      };
      
      // Only allow these fields to be updated if event is not expired
      if (!isEventExpired) {
        settings.start_at = startAt ? new Date(startAt).toISOString() : null;
        settings.end_at = endAt ? new Date(endAt).toISOString() : null;
        settings.max_shots = Math.max(1, Number(maxShots) || 1);
        settings.expected_guests = Math.max(0, Number(expectedGuests) || 0);
        settings.enable_video = enableVideo;
      }
      
      const success = await updateEventSettings(token, settings);
      if (!success) throw new Error("فشل في حفظ الإعدادات");
      toast({
        title: "تم حفظ التغييرات بنجاح"
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
  return <div className="grid gap-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-right">صورة الغطاء</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="cover-upload" className="text-right">صورة الغطاء الرئيسية</Label>
            {coverUrl ? (
              <div className="space-y-2">
                <div className="relative">
                  <img 
                    src={coverUrl} 
                    alt="صورة الغطاف" 
                    className="w-full h-40 object-cover rounded-md border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      document.getElementById('cover-file-input')?.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    استبدال الصورة
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCoverUrl("")}
                  >
                    حذف الصورة
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">اختر صورة الغطاء للمناسبة</p>
                <label
                  htmlFor="cover-file-input"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90"
                >
                  <Upload className="w-4 h-4" />
                  رفع صورة
                </label>
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="cover-file-input"
              ref={fileInputRef}
            />
            
            <p className="text-xs text-muted-foreground">
              ستُستخدم هذه الصورة في جميع شاشات المناسبة (الترحيب، الألبوم، لوحة التحكم) ما لم يتم تخصيص صور منفصلة في إعدادات التخصيص.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>تفاصيل المناسبة</span>
            {isEventExpired && (
              <span className="text-sm font-normal text-muted-foreground bg-muted px-3 py-1 rounded-full">
                المناسبة منتهية - تعديل محدود
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-right">اسم المناسبة</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="أدخل اسم المناسبة" className="text-right" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-right">الوصف</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف المناسبة (اختياري)" rows={3} className="text-right" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start" className="text-right">
                وقت البداية
                {isEventExpired && <span className="text-xs text-muted-foreground"> (غير قابل للتعديل)</span>}
              </Label>
              <Input 
                id="start" 
                type="datetime-local" 
                value={startAt} 
                onChange={e => setStartAt(e.target.value)} 
                className="text-right" 
                disabled={isEventExpired}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end" className="text-right">
                وقت الانتهاء
                {isEventExpired && <span className="text-xs text-muted-foreground"> (غير قابل للتعديل)</span>}
              </Label>
              <Input 
                id="end" 
                type="datetime-local" 
                value={endAt} 
                onChange={e => setEndAt(e.target.value)} 
                className="text-right" 
                disabled={isEventExpired}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxShots" className="text-right">
              عدد الصور المسموحة لكل مشارك
              {isEventExpired && <span className="text-xs text-muted-foreground"> (غير قابل للتعديل)</span>}
            </Label>
            <Select 
              value={maxShots.toString()} 
              onValueChange={(value) => setMaxShots(Number(value))}
              disabled={isEventExpired}
            >
              <SelectTrigger className="text-right">
                <SelectValue placeholder="اختر عدد الصور" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="999">بلا حدود 👑</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expectedGuests" className="text-right">
              عدد الضيوف المتوقع
              {isEventExpired && <span className="text-xs text-muted-foreground"> (غير قابل للتعديل)</span>}
            </Label>
            <Select 
              value={showCustomGuestInput ? "custom" : (expectedGuests === 0 ? "undefined" : expectedGuests.toString())} 
              onValueChange={(value) => {
                if (value === "custom") {
                  setShowCustomGuestInput(true);
                } else if (value === "undefined") {
                  setExpectedGuests(0);
                  setShowCustomGuestInput(false);
                } else {
                  setExpectedGuests(Number(value));
                  setShowCustomGuestInput(false);
                }
              }}
              disabled={isEventExpired}
            >
              <SelectTrigger className="text-right">
                <SelectValue placeholder="اختر عدد الضيوف" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="undefined">غير محدد</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="7">7</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="75">75</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="150">150</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="300">300</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="custom">عدد مخصص</SelectItem>
              </SelectContent>
            </Select>
            
            {showCustomGuestInput && (
              <div className="mt-2">
                <Input 
                  type="number" 
                  min={1}
                  value={expectedGuests} 
                  onChange={(e) => setExpectedGuests(Number(e.target.value))}
                  placeholder="أدخل العدد المطلوب"
                  className="text-right" 
                  disabled={isEventExpired}
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Switch 
                checked={enableVideo} 
                onCheckedChange={setEnableVideo} 
                disabled={isEventExpired}
              />
              <div className="flex items-center gap-2 flex-row-reverse">
                <Video className="h-4 w-4" />
                <div className="text-right">
                  <Label>
                    تفعيل الفيديو
                    {isEventExpired && <span className="text-xs text-muted-foreground block"> (غير قابل للتعديل)</span>}
                  </Label>
                  <p className="text-sm text-muted-foreground">السماح بتسجيل الفيديو</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
              <div className="flex items-center gap-2 flex-row-reverse">
                {isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                <div className="text-right">
                  <Label>خصوصية المناسبة</Label>
                   <p className="text-sm text-muted-foreground">
                     {isPrivate ? "خاصة - تحتاج كلمة سر" : "عامة - يمكن للجميع الانضمام"}
                   </p>
                </div>
              </div>
            </div>
          </div>

          {isPrivate && (
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-right">كلمة المرور (للمناسبات الخاصة)</Label>
              <div className="relative">
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور"
                  className="text-right pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="country" className="flex items-center gap-2 justify-end flex-row-reverse">
              <Globe className="h-4 w-4" />
              رمز البلد
            </Label>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="اختر رمز البلد" />
              </SelectTrigger>
              <SelectContent>
                {getSupportedCountries().map(country => <SelectItem key={country.code} value={country.code}>
                    {country.nameAr} ({country.code})
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} className="w-full flex items-center justify-center gap-2 flex-row-reverse">
            <Save className="h-4 w-4" />
            <span>حفظ التغييرات</span>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 text-right">إعدادات متقدمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hide/Show Event Section */}
          <div className="p-4 border border-amber-500/50 rounded-lg bg-amber-50/50 text-right">
            <h4 className="font-semibold text-amber-700 mb-2">
              {eventData?.is_hidden ? "إظهار المناسبة" : "إخفاء المناسبة"}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              {eventData?.is_hidden 
                ? "المناسبة مخفية حالياً. يمكنك إظهارها مرة أخرى للضيوف."
                : "إخفاء المناسبة عن الضيوف مؤقتاً دون حذف البيانات."
              }
            </p>
            <Button 
              variant={eventData?.is_hidden ? "default" : "secondary"} 
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('events')
                    .update({ is_hidden: !eventData?.is_hidden } as any)
                    .eq('token', token);
                    
                  if (error) throw error;
                  
                  toast({
                    title: eventData?.is_hidden ? "تم إظهار المناسبة" : "تم إخفاء المناسبة"
                  });
                  
                  onEventUpdate();
                } catch (error) {
                  toast({
                    title: "فشل في تحديث حالة المناسبة",
                    description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
                    variant: "destructive"
                  });
                }
              }}
            >
              {eventData?.is_hidden ? "إظهار المناسبة" : "إخفاء المناسبة"}
            </Button>
          </div>

          {/* Delete Event Section */}
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5 text-right">
            <h4 className="font-semibold text-destructive mb-2">حذف المناسبة نهائياً</h4>
            <p className="text-sm text-muted-foreground mb-4">
              سيتم حذف جميع البيانات والصور والمباركات المرتبطة بهذه المناسبة نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <Button variant="destructive" onClick={async () => {
            const firstConfirm = window.confirm("هل أنت متأكد من حذف هذه المناسبة نهائياً؟\n\nسيتم حذف:\n- جميع الصور\n- جميع المباركات\n- جميع بيانات المشاركين\n- المناسبة كاملة");
            if (!firstConfirm) return;
            const secondConfirm = window.confirm("تأكيد أخير: هذا الإجراء لا يمكن التراجع عنه!\n\nاضغط موافق للمتابعة أو إلغاء للتوقف.");
            if (!secondConfirm) return;
            try {
              console.log("بدء عملية حذف المناسبة:", token);

              // Delete all photos from storage first
              console.log("حذف الصور من التخزين...");
              try {
                const {
                  data: files
                } = await supabase.storage.from("event-media").list(`events/${token}`, {
                  limit: 1000
                });
                if (files && files.length > 0) {
                  const filePaths = files.map(file => `events/${token}/${file.name}`);
                  const {
                    error: storageError
                  } = await supabase.storage.from("event-media").remove(filePaths);
                  if (storageError) console.error("خطأ في حذف الصور:", storageError);
                }
              } catch (storageErr) {
                console.error("خطأ في الوصول للصور:", storageErr);
              }

              // Delete cover image if exists
              console.log("حذف صورة الغلاف...");
              if (eventData?.cover_url) {
                try {
                  const coverFileName = eventData.cover_url.split('/').pop();
                  if (coverFileName && coverFileName.includes(token)) {
                    await supabase.storage.from("event-media").remove([coverFileName]);
                  }
                } catch (coverErr) {
                  console.error("خطأ في حذف صورة الغلاف:", coverErr);
                }
              }

              // Delete blessings
              console.log("حذف المباركات...");
              const {
                error: blessingsError
              } = await supabase.from("blessings").delete().eq("event_token", token);
              if (blessingsError) console.error("خطأ في حذف المباركات:", blessingsError);

              // Delete participants
              console.log("حذف المشاركين...");
              const {
                error: participantsError
              } = await supabase.from("participants").delete().eq("event_token", token);
              if (participantsError) console.error("خطأ في حذف المشاركين:", participantsError);

              // Delete the event itself
              console.log("حذف المناسبة...");
              const {
                error: eventError
              } = await supabase.from("events").delete().eq("token", token);
              if (eventError) {
                console.error("خطأ في حذف المناسبة:", eventError);
                throw eventError;
              }
              console.log("تم حذف المناسبة بنجاح");
              toast({
                title: "تم حذف المناسبة نهائياً بنجاح"
              });

              // Redirect to account page after a short delay
              setTimeout(() => {
                window.location.href = "/account";
              }, 1000);
            } catch (error) {
              console.error("خطأ عام في حذف المناسبة:", error);
              toast({
                title: "فشل في حذف المناسبة",
                description: "حدث خطأ أثناء الحذف. يرجى المحاولة مرة أخرى.",
                variant: "destructive"
              });
            }
          }}>
              حذف المناسبة نهائياً
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
}