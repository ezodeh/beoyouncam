import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Save } from "lucide-react";

interface EventDetailsTabProps {
  token: string;
  eventData: any;
  onEventUpdate: () => void;
}

export function EventDetailsTab({ token, eventData, onEventUpdate }: EventDetailsTabProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(eventData?.title || "");
  const [description, setDescription] = useState(eventData?.description || "");
  const [startAt, setStartAt] = useState(eventData?.start_at ? eventData.start_at.slice(0, 16) : "");
  const [endAt, setEndAt] = useState(eventData?.end_at ? eventData.end_at.slice(0, 16) : "");
  const [maxShots, setMaxShots] = useState(eventData?.max_shots || 120);
  const [expectedGuests, setExpectedGuests] = useState<number>(eventData?.expected_guests ?? 100);
  const [coverUrl, setCoverUrl] = useState(eventData?.cover_url || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `cover-${token}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('event-media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('event-media')
        .getPublicUrl(fileName);

      setCoverUrl(publicUrl);
      toast({ title: "تم رفع الصورة بنجاح" });
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
      const { error } = await supabase
        .from("events")
        .update({
          title: title.trim() || null,
          description: description.trim() || null,
          start_at: startAt ? new Date(startAt).toISOString() : null,
          end_at: endAt ? new Date(endAt).toISOString() : null,
          max_shots: Math.max(1, Number(maxShots) || 1),
          expected_guests: Math.max(0, Number(expectedGuests) || 0),
          cover_url: coverUrl || null,
        })
        .eq("token", token);

      if (error) throw error;

      toast({ title: "تم حفظ التغييرات بنجاح" });
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
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>صورة الغلاف</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {coverUrl && (
            <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden border">
              <img src={coverUrl} alt="صورة الغلاف" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "جاري الرفع..." : "رفع صورة"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المناسبة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">اسم المناسبة</Label>
            <Input 
              id="title"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أدخل اسم المناسبة"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea 
              id="description"
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف المناسبة (اختياري)"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start">وقت البداية</Label>
              <Input 
                id="start"
                type="datetime-local" 
                value={startAt} 
                onChange={(e) => setStartAt(e.target.value)} 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end">وقت الانتهاء</Label>
              <Input 
                id="end"
                type="datetime-local" 
                value={endAt} 
                onChange={(e) => setEndAt(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxShots">عدد الصور المسموحة لكل مشارك</Label>
            <Input 
              id="maxShots"
              type="number" 
              min={1} 
              value={maxShots} 
              onChange={(e) => setMaxShots(Number(e.target.value))} 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expectedGuests">عدد الضيوف المتوقع</Label>
            <Input
              id="expectedGuests"
              type="number"
              min={0}
              value={expectedGuests}
              onChange={(e) => setExpectedGuests(Number(e.target.value))}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            حفظ التغييرات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}