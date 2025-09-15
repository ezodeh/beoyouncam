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
import { updateEventSettings, hasEventStarted } from "@/lib/eventSettings";
import { Image, Trash2, Download, Eye, EyeOff, Heart, Upload, Save, Clock, Share2, Mail, MessageCircle, Calendar, Send, StopCircle, Edit } from "lucide-react";
import { ImageEditor } from "@/components/ui/image-editor";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Photo {
  id: string;
  url: string;
  created_at: string;
  participant_name: string;
  file_path: string;
}

interface Blessing {
  id: string;
  content: string;
  name: string;
  created_at: string;
}

interface EyeAlbum {
  id: string;
  participant_name: string;
  photos_count: number;
  created_at: string;
}

interface AlbumTabProps {
  token: string;
  eventData: any;
  onEventUpdate: () => void;
}

export function AlbumTab({ token, eventData, onEventUpdate }: AlbumTabProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [eyeAlbums, setEyeAlbums] = useState<EyeAlbum[]>([]);
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
  const [customPublishDate, setCustomPublishDate] = useState(eventData?.custom_publish_date || "");
  const [customPublishTime, setCustomPublishTime] = useState(eventData?.custom_publish_time || "");
  
  // Check if event has started to determine WhatsApp restriction  
  const eventHasStarted = hasEventStarted(eventData);
  const canChangeWhatsAppSettings = !eventHasStarted;

  // Countdown state for scheduled publishing
  const [countdown, setCountdown] = useState("");

  // Calculate countdown for scheduled publishing
  useEffect(() => {
    let targetTime: Date | null = null;
    
    // Calculate target time based on album publish time setting
    if (albumPublishTime === "specific_time" && customPublishDate && customPublishTime) {
      targetTime = new Date(`${customPublishDate}T${customPublishTime}`);
    } else if (albumPublishTime === "after_event" && eventData?.end_at) {
      targetTime = new Date(eventData.end_at);
    } else if (albumPublishTime === "after_12h" && eventData?.end_at) {
      targetTime = new Date(new Date(eventData.end_at).getTime() + (12 * 60 * 60 * 1000));
    } else if (albumPublishTime === "after_24h" && eventData?.end_at) {
      targetTime = new Date(new Date(eventData.end_at).getTime() + (24 * 60 * 60 * 1000));
    } else if (albumPublishTime === "after_creation" && eventData?.created_at) {
      targetTime = new Date(new Date(eventData.created_at).getTime() + (customPublishDelay * 60 * 60 * 1000));
    }
    
    if (targetTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const timeLeft = targetTime.getTime() - now.getTime();
        
        if (timeLeft > 0) {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          setCountdown(`سيتم النشر بعد : ${formattedTime}`);
        } else {
          setCountdown("حان وقت النشر!");
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setCountdown("");
    }
  }, [albumPublishTime, customPublishDate, customPublishTime, customPublishDelay, eventData]);

  useEffect(() => {
    fetchPhotos();
    fetchBlessings();
    fetchEyeAlbums();
  }, [token]);

  const fetchPhotos = async () => {
    try {
      // Get media submissions with participant names
      const { data: submissions, error } = await supabase
        .from("media_submissions")
        .select(`
          *,
          participants (name)
        `)
        .eq("event_token", token)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      if (!submissions || submissions.length === 0) {
        setPhotos([]);
        return;
      }

      const photoData = submissions
        .filter((submission: any) => {
          return submission.media_type === "image";
        })
        .map((submission: any) => {
          const { data: { publicUrl } } = supabase.storage
            .from("event-media")
            .getPublicUrl(submission.file_path);
          
          return {
            id: submission.id,
            url: publicUrl,
            created_at: submission.created_at,
            participant_name: submission.participants?.name || submission.participant_name || "مشارك غير معروف",
            file_path: submission.file_path
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

  const fetchBlessings = async () => {
    try {
      const { data, error } = await supabase
        .from('blessings')
        .select('id, content, name, created_at')
        .eq('event_token', token)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBlessings(data || []);
    } catch (error) {
      console.error("Error fetching blessings:", error);
      setBlessings([]);
    }
  };

  const fetchEyeAlbums = async () => {
    try {
      // Fetch participants with their photo counts sorted by name
      const { data: participantsData, error } = await supabase
        .from('participants')
        .select(`
          id, 
          name, 
          created_at,
          media_submissions (count)
        `)
        .eq('event_token', token)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Create eye albums with actual photo counts
      const eyeData: EyeAlbum[] = (participantsData || [])
        .filter(p => p.media_submissions && p.media_submissions.length > 0)
        .map(p => ({
          id: p.id,
          participant_name: p.name || 'مشارك غير معروف',
          photos_count: p.media_submissions[0]?.count || 0,
          created_at: p.created_at
        }))
        .sort((a, b) => a.participant_name.localeCompare(b.participant_name, 'ar'));
      
      setEyeAlbums(eyeData);
    } catch (error) {
      console.error("Error fetching eye albums:", error);
      setEyeAlbums([]);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;

    try {
      // Find the photo to get the file path
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return;

      // Delete from storage permanently
      const { error: storageError } = await supabase.storage
        .from("event-media")
        .remove([photo.file_path]);
      
      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("media_submissions")
        .delete()
        .eq("id", photoId);
      
      if (dbError) throw dbError;
      
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

  const handlePhotoEdit = async (photoId: string, newImageSrc: string) => {
    try {
      // Convert blob URL to actual file
      const response = await fetch(newImageSrc);
      const blob = await response.blob();
      
      // Create new file with edited suffix
      const originalFileName = photoId;
      const fileExtension = originalFileName.split('.').pop() || 'jpg';
      const nameWithoutExt = originalFileName.replace(`.${fileExtension}`, '');
      const newFileName = `${nameWithoutExt}_edited_${Date.now()}.${fileExtension}`;
      
      // Upload edited image
      const prefix = `events/${token}`;
      const { data, error } = await supabase.storage
        .from("event-media")
        .upload(`${prefix}/${newFileName}`, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL for the new image
      const { data: { publicUrl } } = supabase.storage
        .from("event-media")
        .getPublicUrl(`${prefix}/${newFileName}`);

      // Update photos list
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId 
          ? { ...photo, id: newFileName, url: publicUrl }
          : photo
      ));

      toast({ 
        title: "تم حفظ الصورة المعدلة بنجاح",
        description: "تم إنشاء نسخة جديدة من الصورة مع التعديلات"
      });

      // Clean up blob URL
      URL.revokeObjectURL(newImageSrc);
      
      // Refresh photos to ensure consistency
      setTimeout(() => {
        fetchPhotos();
      }, 1000);
    } catch (error) {
      console.error("Error editing photo:", error);
      toast({ 
        title: "فشل في حفظ الصورة المعدلة", 
        variant: "destructive"
      });
      // Clean up blob URL even on error
      URL.revokeObjectURL(newImageSrc);
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
        custom_publish_date: customPublishDate,
        custom_publish_time: customPublishTime,
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

  const handlePublishWithConfirmation = () => {
    if (!isAlbumPublished) {
      // Show confirmation only when publishing (not unpublishing)
      return;
    }
    toggleAlbumPublish();
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
      {/* Album Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Eye className="h-5 w-5" />
            معاينة الألبوم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" asChild>
            <a href={`/album/${token}`} target="_blank">
              <Eye className="h-4 w-4 ml-2" />
              معاينة الألبوم
            </a>
          </Button>
        </CardContent>
      </Card>
      {/* Album Sharing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Share2 className="h-5 w-5" />
            إعدادات المشاركة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shareMethod">طريقة المشاركة</Label>
              <Select 
                value={shareMethod} 
                onValueChange={setShareMethod}
                disabled={!canChangeWhatsAppSettings && shareMethod === "whatsapp"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة المشاركة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني (افتراضي)
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp" disabled={!canChangeWhatsAppSettings && shareMethod !== "whatsapp"}>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      واتساب {!canChangeWhatsAppSettings ? "(لا يمكن التغيير بعد بدء المناسبة)" : "(يتطلب أرقام هاتف)"}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {!canChangeWhatsAppSettings && shareMethod === "whatsapp" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    لا يمكن تغيير طريقة المشاركة بعد بدء المناسبة لضمان توافق البيانات المجمعة.
                  </p>
                </div>
              )}
              {shareMethod === "whatsapp" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    تذكير: عند اختيار واتساب، تأكد من تفعيل جمع أرقام الهاتف في إعدادات الخصوصية.
                  </p>
                </div>
              )}
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
                  <SelectItem value="after_creation">بعد إنشاء المناسبة</SelectItem>
                  <SelectItem value="after_12h">بعد 12 ساعة من الانتهاء</SelectItem>
                  <SelectItem value="after_24h">بعد 24 ساعة من الانتهاء</SelectItem>
                  <SelectItem value="specific_time">وقت محدد</SelectItem>
                </SelectContent>
              </Select>
            </div>


            {/* After Creation Delay */}
            {albumPublishTime === "after_creation" && (
              <div className="space-y-2">
                <Label htmlFor="creationDelay">عدد الساعات بعد إنشاء المناسبة</Label>
                <Input
                  id="creationDelay"
                  type="number"
                  min={1}
                  max={168}
                  value={customPublishDelay}
                  onChange={(e) => setCustomPublishDelay(Number(e.target.value))}
                  placeholder="عدد الساعات بعد إنشاء المناسبة"
                />
              </div>
            )}

            {/* Specific Time */}
            {albumPublishTime === "specific_time" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="publishDate">تاريخ النشر</Label>
                    <Input
                      id="publishDate"
                      type="date"
                      value={customPublishDate}
                      onChange={(e) => setCustomPublishDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publishTime">وقت النشر</Label>
                    <Input
                      id="publishTime"
                      type="time"
                      value={customPublishTime}
                      onChange={(e) => setCustomPublishTime(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Countdown */}
                {countdown && customPublishDate && customPublishTime && !isAlbumPublished && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{countdown}</span>
                    </div>
                  </div>
                )}
                
                {/* Publish Now Button for Specific Time */}
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="default" 
                        disabled={isAlbumPublished}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 ml-2" />
                        نشر الآن
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد النشر</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من نشر الألبوم الآن؟ سيتم إرسال رسائل للضيوف مع رابط الألبوم ولن يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={toggleAlbumPublish}>
                          نعم، نشر الآن
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {isAlbumPublished && (
                    <Button 
                      variant="outline" 
                      onClick={toggleAlbumPublish}
                      className="flex-1"
                    >
                      <StopCircle className="h-4 w-4 ml-2" />
                      إلغاء النشر
                    </Button>
                  )}
                </div>
              </>
            )}


            {/* Countdown and Publish Controls for Scheduled Options */}
            {!["specific_time", "immediately"].includes(albumPublishTime) && (
              <>
                {/* Countdown Display */}
                {countdown && !isAlbumPublished && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{countdown}</span>
                    </div>
                  </div>
                )}
                
                
                {/* Publish Controls */}
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="default" 
                        disabled={isAlbumPublished}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 ml-2" />
                        {isAlbumPublished ? "منشور" : "نشر الآن"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد النشر</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من نشر الألبوم الآن؟ سيتم إرسال رسائل للضيوف مع رابط الألبوم ولن يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={toggleAlbumPublish}>
                          نعم، نشر الآن
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {isAlbumPublished && (
                    <Button 
                      variant="outline" 
                      onClick={toggleAlbumPublish}
                      className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <StopCircle className="h-4 w-4 ml-2 text-destructive" />
                      إلغاء النشر
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Immediate Publishing */}
            {albumPublishTime === "immediately" && (
              <>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    اضغط على "نشر الآن" لإرسال رابط الألبوم للضيوف.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="default" 
                        disabled={isAlbumPublished}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 ml-2" />
                        {isAlbumPublished ? "منشور" : "نشر الآن"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد النشر</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من نشر الألبوم الآن؟ سيتم إرسال رسائل للضيوف مع رابط الألبوم ولن يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={toggleAlbumPublish}>
                          نعم، نشر الآن
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {isAlbumPublished && (
                    <Button 
                      variant="outline" 
                      onClick={toggleAlbumPublish}
                      className="flex-1"
                    >
                      <StopCircle className="h-4 w-4 ml-2" />
                      إلغاء النشر
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Button onClick={handleSaveAlbumSettings} className="w-full">
              <Save className="h-4 w-4 ml-2" />
              حفظ إعدادات المشاركة
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={async () => {
                try {
                  toast({ title: "جاري تحضير الألبوم للتحميل..." });
                  
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) {
                    toast({ title: "يرجى تسجيل الدخول", variant: "destructive" });
                    return;
                  }

                  // Call the edge function with proper URL construction
                  const functionUrl = `https://jmoomibffevngnpcbvfi.supabase.co/functions/v1/download-album?token=${token}`;
                  
                  const response = await fetch(functionUrl, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${session.access_token}`,
                      'Content-Type': 'application/json',
                    },
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل في تحميل الألبوم');
                  }

                  // Get the ZIP file as blob
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `album-${eventData?.title || token}.zip`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);

                  toast({ title: "تم تحميل الألبوم بنجاح" });
                } catch (error) {
                  console.error('Download error:', error);
                  toast({ 
                    title: "فشل في تحميل الألبوم", 
                    description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
                    variant: "destructive" 
                  });
                }
              }}
            >
              <Download className="h-4 w-4 ml-2" />
              تحميل الألبوم كاملاً (ZIP)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photos Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Image className="h-5 w-5" />
            إدارة الصور ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد صور في الألبوم حتى الآن
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="flex-shrink-0 group">
                      <div className="w-32 h-32 rounded-lg overflow-hidden border relative">
                        <img
                          src={photo.url}
                          alt={`صورة من ${photo.participant_name}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setLightboxIndex(index)}
                        />
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setLightboxIndex(index)}
                            className="p-1 h-auto"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <ImageEditor
                            src={photo.url}
                            onImageChange={(newImageSrc) => handlePhotoEdit(photo.id, newImageSrc)}
                          >
                            <Button
                              size="sm"
                              variant="secondary"
                              className="p-1 h-auto"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </ImageEditor>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => downloadPhoto(photo.url, `photo-${photo.id}.jpg`)}
                            className="p-1 h-auto"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePhoto(photo.id)}
                            className="p-1 h-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-center text-muted-foreground w-32">
                        <div className="truncate">{photo.participant_name}</div>
                        <div>{new Date(photo.created_at).toLocaleDateString('en-GB')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blessings Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Heart className="h-5 w-5" />
            المباركات ({blessings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blessings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مباركات حتى الآن
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                  {blessings.map((blessing) => (
                    <div key={blessing.id} className="flex-shrink-0 group w-64">
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 h-32 overflow-hidden">
                        <p className="text-sm line-clamp-4">{blessing.content}</p>
                      </div>

                      <div className="mt-2 text-xs text-center text-muted-foreground">
                        <div className="truncate font-medium">{blessing.name || 'مجهول'}</div>
                        <div>{new Date(blessing.created_at).toLocaleDateString('en-GB')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eye Albums Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Eye className="h-5 w-5" />
            عيون ({eyeAlbums.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eyeAlbums.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد ألبومات بعيون حتى الآن
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                  {eyeAlbums.map((album) => (
                    <div key={album.id} className="flex-shrink-0 group">
                      <a 
                        href={`/album/${token}/eyes/${encodeURIComponent(album.participant_name)}`}
                        className="block w-32 h-32 rounded-lg border bg-gradient-to-br from-secondary/20 to-secondary/40 flex flex-col items-center justify-center hover:bg-secondary/30 transition-colors"
                      >
                        <Eye className="h-8 w-8 text-secondary-foreground/60 mb-2" />
                        <span className="text-lg font-bold text-secondary-foreground/80">{album.photos_count}</span>
                        <span className="text-xs text-secondary-foreground/60">صورة</span>
                      </a>

                      <div className="mt-2 text-xs text-center text-muted-foreground w-32">
                        <div className="truncate font-medium">{album.participant_name}</div>
                        <div>{new Date(album.created_at).toLocaleDateString('en-GB')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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