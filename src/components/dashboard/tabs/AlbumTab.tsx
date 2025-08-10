import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateEventSettings } from "@/lib/eventSettings";
import { Image, Trash2, Download, Eye, EyeOff, Star, Upload, Save, Clock, Share2, Mail, MessageCircle } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  created_at: string;
  participant_name: string;
}

interface AlbumTabProps {
  token: string;
  eventData: any;
  onEventUpdate: () => void;
}

export function AlbumTab({ token, eventData, onEventUpdate }: AlbumTabProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Album settings
  const [albumTitle, setAlbumTitle] = useState(eventData?.album_title || eventData?.title || "ألبوم المناسبة");
  const [albumDescription, setAlbumDescription] = useState(eventData?.album_description || "مجموعة من أجمل اللحظات");
  const [albumCoverUrl, setAlbumCoverUrl] = useState(eventData?.album_cover_url || eventData?.cover_url || "");
  const [albumPublishTime, setAlbumPublishTime] = useState(eventData?.album_publish_time || "after_event");
  const [isAlbumPublished, setIsAlbumPublished] = useState(eventData?.is_album_published ?? false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Album sharing settings
  const [shareMethod, setShareMethod] = useState(eventData?.share_method || "email");
  const [customPublishDelay, setCustomPublishDelay] = useState(eventData?.custom_publish_delay || 24);

  useEffect(() => {
    fetchPhotos();
  }, [token]);

  const fetchPhotos = async () => {
    try {
      // استخدام بيانات حقيقية من التخزين
      const prefix = `events/${token}`;
      const { data: files, error } = await supabase.storage
        .from("event-media")
        .list(prefix, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
      
      if (error) throw error;
      
      if (!files || files.length === 0) {
        setPhotos([]);
        return;
      }

      const photoData = files
        .filter((file: any) => {
          const ext = file.name.split('.').pop()?.toLowerCase();
          return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
        })
        .map((file: any) => {
          const { data: pub } = supabase.storage.from("event-media").getPublicUrl(`${prefix}/${file.name}`);
          return {
            id: file.name,
            url: pub.publicUrl,
            created_at: file.created_at || new Date().toISOString(),
            participant_name: "مشارك" // placeholder
          };
        });

      setPhotos(photoData);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;

    try {
      // Delete from storage permanently
      const prefix = `events/${token}`;
      const { error } = await supabase.storage
        .from("event-media")
        .remove([`${prefix}/${photoId}`]);
      
      if (error) throw error;
      
      // Remove from local state immediately
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast({ title: "تم حذف الصورة نهائياً" });
      
      // Refresh photos list after deletion
      setTimeout(() => {
        fetchPhotos();
      }, 500);
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "فشل في حذف الصورة",
        variant: "destructive"
      });
      // Refresh photos list in case of error to show current state
      fetchPhotos();
    }
  };

  const downloadPhoto = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      toast({
        title: "فشل في تحميل الصورة",
        variant: "destructive"
      });
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `album-cover-${token}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('event-media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('event-media')
        .getPublicUrl(fileName);

      setAlbumCoverUrl(publicUrl);
      toast({ title: "تم رفع صورة الغلاف بنجاح" });
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

  const handleSaveAlbumSettings = async () => {
    try {
      const settings = {
        album_title: albumTitle,
        album_description: albumDescription,
        album_cover_url: albumCoverUrl,
        album_publish_time: albumPublishTime,
        is_album_published: isAlbumPublished,
        share_method: shareMethod,
        custom_publish_delay: customPublishDelay,
      };

      const success = await updateEventSettings(token, settings);
      
      if (!success) throw new Error("فشل في حفظ الإعدادات");

      toast({ title: "تم حفظ إعدادات الألبوم بنجاح" });
      onEventUpdate();
    } catch (error) {
      toast({ 
        title: "فشل في الحفظ", 
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  const toggleAlbumPublish = async () => {
    const newStatus = !isAlbumPublished;
    setIsAlbumPublished(newStatus);
    
    try {
      const success = await updateEventSettings(token, { is_album_published: newStatus });
      if (!success) throw new Error("فشل في تحديث حالة النشر");
      
      toast({ 
        title: newStatus ? "تم نشر الألبوم" : "تم إخفاء الألبوم",
        description: newStatus ? "الألبوم متاح الآن للضيوف" : "الألبوم لم يعد مرئياً للضيوف"
      });
      onEventUpdate();
    } catch (error) {
      setIsAlbumPublished(!newStatus); // Revert on error
      toast({ 
        title: "فشل في تحديث حالة النشر", 
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>جاري تحميل الصور...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Album Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Image className="h-5 w-5" />
            إعدادات الألبوم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Album Cover */}
          <div className="space-y-4">
            <Label>صورة غلاف الألبوم</Label>
            {albumCoverUrl && (
              <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden border">
                <img src={albumCoverUrl} alt="غلاف الألبوم" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 ml-2" />
                {uploading ? "جاري الرفع..." : "رفع صورة الغلاف"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Album Info */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="albumTitle">عنوان الألبوم</Label>
              <Input
                id="albumTitle"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                placeholder="عنوان الألبوم"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="albumDescription">وصف الألبوم</Label>
              <Textarea
                id="albumDescription"
                value={albumDescription}
                onChange={(e) => setAlbumDescription(e.target.value)}
                placeholder="وصف قصير للألبوم"
                rows={3}
              />
            </div>
          </div>

          {/* Album Sharing Settings */}
          <div className="space-y-4">
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
            {albumPublishTime === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customDelay">عدد الساعات للتأخير</Label>
                <Input
                  id="customDelay"
                  type="number"
                  min={1}
                  max={168}
                  value={customPublishDelay}
                  onChange={(e) => setCustomPublishDelay(Number(e.target.value))}
                  placeholder="عدد الساعات"
                />
              </div>
            )}

            {/* Manual Publish Toggle */}
            {albumPublishTime === "manual" && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 text-right">
                  <Clock className="h-5 w-5" />
                  <div>
                    <Label className="text-base">نشر الألبوم الآن</Label>
                    <p className="text-sm text-muted-foreground">
                      {isAlbumPublished ? "الألبوم متاح للضيوف" : "الألبوم مخفي عن الضيوف"}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={isAlbumPublished} 
                  onCheckedChange={toggleAlbumPublish}
                />
              </div>
            )}

            {albumPublishTime === "manual" && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  النشر اليدوي: لن يظهر الألبوم للضيوف إلا عندما تختار نشره بنفسك من لوحة التحكم.
                </p>
              </div>
            )}
          </div>

          <Button onClick={handleSaveAlbumSettings} className="w-full">
            <Save className="h-4 w-4 ml-2" />
            حفظ إعدادات الألبوم
          </Button>
        </CardContent>
      </Card>

      {/* Photos Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-right">
            <Image className="h-5 w-5" />
            إدارة الصور ({photos.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/album/${token}`} target="_blank">
                <Eye className="h-4 w-4 ml-2" />
                معاينة الألبوم
              </a>
            </Button>
            <Button variant="default" size="sm" asChild>
              <a href={`/event/${token}/submit`}>
                <Share2 className="h-4 w-4 ml-2" />
                مشاركة الألبوم
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد صور في الألبوم حتى الآن
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={photo.url}
                      alt={`صورة من ${photo.participant_name}`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setLightboxIndex(index)}
                    />
                  </div>
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setLightboxIndex(index)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadPhoto(photo.url, `photo-${photo.id}.jpg`)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePhoto(photo.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    <div>{photo.participant_name}</div>
                    <div>{new Date(photo.created_at).toLocaleDateString('ar-SA')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={photos[lightboxIndex].url}
              alt="عرض الصورة"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setLightboxIndex(null)}
            >
              إغلاق
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}