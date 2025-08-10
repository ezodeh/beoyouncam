import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Save, Video, Lock, Unlock, Globe } from "lucide-react";
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
  const [title, setTitle] = useState(eventData?.title || "");
  const [description, setDescription] = useState(eventData?.description || "");
  const [startAt, setStartAt] = useState(eventData?.start_at ? eventData.start_at.slice(0, 16) : "");
  const [endAt, setEndAt] = useState(eventData?.end_at ? eventData.end_at.slice(0, 16) : "");
  const [maxShots, setMaxShots] = useState(eventData?.max_shots || 120);
  const [expectedGuests, setExpectedGuests] = useState<number>(eventData?.expected_guests ?? 100);
  const [coverUrl, setCoverUrl] = useState(eventData?.cover_url || "");
  const [enableVideo, setEnableVideo] = useState(eventData?.enable_video ?? true);
  const [isPrivate, setIsPrivate] = useState(eventData?.is_private ?? false);
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
      const settings = {
        title: title.trim() || "مناسبة جديدة",
        description: description.trim() || null,
        start_at: startAt ? new Date(startAt).toISOString() : null,
        end_at: endAt ? new Date(endAt).toISOString() : null,
        max_shots: Math.max(1, Number(maxShots) || 1),
        expected_guests: Math.max(0, Number(expectedGuests) || 0),
        cover_url: coverUrl || null,
        enable_video: enableVideo,
        is_private: isPrivate,
        country_code: countryCode
      };
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
        
        
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-right">تفاصيل المناسبة</CardTitle>
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
              <Label htmlFor="start" className="text-right">وقت البداية</Label>
              <Input id="start" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="text-right" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end" className="text-right">وقت الانتهاء</Label>
              <Input id="end" type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} className="text-right" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxShots" className="text-right">عدد الصور المسموحة لكل مشارك</Label>
            <Input id="maxShots" type="number" min={1} value={maxShots} onChange={e => setMaxShots(Number(e.target.value))} className="text-right" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expectedGuests" className="text-right">عدد الضيوف المتوقع</Label>
            <Input id="expectedGuests" type="number" min={0} value={expectedGuests} onChange={e => setExpectedGuests(Number(e.target.value))} className="text-right" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Switch checked={enableVideo} onCheckedChange={setEnableVideo} />
              <div className="flex items-center gap-2 flex-row-reverse">
                <Video className="h-4 w-4" />
                <div className="text-right">
                  <Label>تفعيل الفيديو</Label>
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
                    {isPrivate ? "خاصة - تحتاج دعوة" : "عامة - يمكن للجميع الانضمام"}
                  </p>
                </div>
              </div>
            </div>
          </div>

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
          <CardTitle className="text-red-600 text-right">المنطقة الخطرة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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