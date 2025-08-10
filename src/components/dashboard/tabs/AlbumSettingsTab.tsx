import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateEventSettings } from "@/lib/eventSettings";
import { 
  Image, 
  Trash2, 
  Download, 
  Eye, 
  EyeOff, 
  Upload, 
  MessageSquare, 
  Users,
  CheckCircle,
  Clock,
  Share2,
  Settings
} from "lucide-react";

interface Photo {
  id: string;
  url: string;
  created_at: string;
  participant_name: string;
  is_hidden?: boolean;
}

interface Blessing {
  id: string;
  name: string;
  content: string;
  created_at: string;
  is_hidden?: boolean;
}

interface AlbumSettingsTabProps {
  token: string;
  eventData: any;
  onEventUpdate: () => void;
}

export function AlbumSettingsTab({ token, eventData, onEventUpdate }: AlbumSettingsTabProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAlbumPublished, setIsAlbumPublished] = useState(eventData?.is_album_published ?? false);

  useEffect(() => {
    fetchAlbumData();
  }, [token]);

  const fetchAlbumData = async () => {
    setLoading(true);
    try {
      // Fetch photos
      const prefix = `events/${token}`;
      const { data: files, error: filesError } = await supabase.storage
        .from("event-media")
        .list(prefix, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
      
      if (filesError) throw filesError;
      
      const photoData = files
        ?.filter((file: any) => {
          const ext = file.name.split('.').pop()?.toLowerCase();
          return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
        })
        .map((file: any) => {
          const { data: pub } = supabase.storage.from("event-media").getPublicUrl(`${prefix}/${file.name}`);
          return {
            id: file.name,
            url: pub.publicUrl,
            created_at: file.created_at || new Date().toISOString(),
            participant_name: "مشارك",
            is_hidden: false
          };
        }) || [];

      setPhotos(photoData);

      // Fetch blessings
      const { data: blessingsData, error: blessingsError } = await supabase
        .from('blessings')
        .select('*')
        .eq('event_token', token)
        .order('created_at', { ascending: false });

      if (blessingsError) throw blessingsError;
      
      setBlessings(blessingsData?.map(b => ({ ...b, is_hidden: false })) || []);
      
    } catch (error) {
      console.error("Error fetching album data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAlbumPublish = async () => {
    const newStatus = !isAlbumPublished;
    setIsAlbumPublished(newStatus);
    
    try {
      const success = await updateEventSettings(token, { is_album_published: newStatus });
      if (!success) throw new Error("فشل في تحديث حالة النشر");
      
      toast({ 
        title: newStatus ? "تم نشر الألبوم" : "تم إلغاء نشر الألبوم",
        description: newStatus ? "الألبوم متاح الآن للضيوف" : "الألبوم لم يعد مرئياً للضيوف"
      });
      onEventUpdate();
    } catch (error) {
      setIsAlbumPublished(!newStatus);
      toast({ 
        title: "فشل في تحديث حالة النشر", 
        variant: "destructive"
      });
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة نهائياً؟")) return;

    try {
      const prefix = `events/${token}`;
      const { error } = await supabase.storage
        .from("event-media")
        .remove([`${prefix}/${photoId}`]);
      
      if (error) throw error;
      
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast({ title: "تم حذف الصورة نهائياً" });
    } catch (error) {
      toast({
        title: "فشل في حذف الصورة",
        variant: "destructive"
      });
    }
  };

  const hidePhoto = async (photoId: string) => {
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, is_hidden: !p.is_hidden } : p
    ));
    toast({ title: "تم تحديث حالة الصورة" });
  };

  const deleteBlessing = async (blessingId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المباركة نهائياً؟")) return;

    try {
      const { error } = await supabase
        .from('blessings')
        .delete()
        .eq('id', blessingId);
      
      if (error) throw error;
      
      setBlessings(prev => prev.filter(b => b.id !== blessingId));
      toast({ title: "تم حذف المباركة نهائياً" });
    } catch (error) {
      toast({
        title: "فشل في حذف المباركة",
        variant: "destructive"
      });
    }
  };

  const hideBlessing = async (blessingId: string) => {
    setBlessings(prev => prev.map(b => 
      b.id === blessingId ? { ...b, is_hidden: !b.is_hidden } : b
    ));
    toast({ title: "تم تحديث حالة المباركة" });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">جاري تحميل بيانات الألبوم...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Publication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Settings className="h-5 w-5" />
            حالة نشر الألبوم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Button
                variant={isAlbumPublished ? "destructive" : "default"}
                onClick={toggleAlbumPublish}
              >
                {isAlbumPublished ? "إلغاء النشر" : "نشر الألبوم"}
              </Button>
              {isAlbumPublished && (
                <Button variant="outline" asChild>
                  <a href={`/album/${token}`} target="_blank">
                    <Eye className="h-4 w-4 ml-2" />
                    معاينة الألبوم
                  </a>
                </Button>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                {isAlbumPublished ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <Badge variant="default" className="bg-green-100 text-green-800">منشور</Badge>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-orange-600" />
                    <Badge variant="secondary">غير منشور</Badge>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isAlbumPublished 
                  ? "الألبوم متاح للضيوف للمشاهدة والمشاركة" 
                  : "الألبوم مخفي عن الضيوف حالياً"
                }
              </p>
            </div>
          </div>

          {!isAlbumPublished && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">إعدادات النشر</h4>
              <p className="text-sm text-orange-700 mb-3">
                عند نشر الألبوم، سيتمكن الضيوف من مشاهدة جميع الصور والمباركات المرئية.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 ml-2" />
                  إعدادات متقدمة للنشر
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/manage/${token}?tab=album`}>
                    <Upload className="h-4 w-4 ml-2" />
                    تخصيص الألبوم
                  </a>
                </Button>
              </div>
            </div>
          )}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className={`aspect-square rounded-lg overflow-hidden border ${photo.is_hidden ? 'opacity-50' : ''}`}>
                    <img
                      src={photo.url}
                      alt={`صورة من ${photo.participant_name}`}
                      className="w-full h-full object-cover"
                    />
                    {photo.is_hidden && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <EyeOff className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => hidePhoto(photo.id)}
                      title={photo.is_hidden ? "إظهار" : "إخفاء"}
                    >
                      {photo.is_hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePhoto(photo.id)}
                      title="حذف نهائي"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>{photo.participant_name}</span>
                      {photo.is_hidden && <Badge variant="secondary" className="text-xs">مخفي</Badge>}
                    </div>
                    <div>{new Date(photo.created_at).toLocaleDateString('ar-SA')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blessings Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <MessageSquare className="h-5 w-5" />
            إدارة المباركات ({blessings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blessings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مباركات حتى الآن
            </div>
          ) : (
            <div className="space-y-4">
              {blessings.map((blessing) => (
                <div key={blessing.id} className={`p-4 border rounded-lg ${blessing.is_hidden ? 'opacity-50 bg-gray-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{blessing.name || "مجهول"}</span>
                        {blessing.is_hidden && <Badge variant="secondary" className="text-xs">مخفي</Badge>}
                        <span className="text-xs text-muted-foreground">
                          {new Date(blessing.created_at).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <p className="text-gray-700">{blessing.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mr-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => hideBlessing(blessing.id)}
                        title={blessing.is_hidden ? "إظهار" : "إخفاء"}
                      >
                        {blessing.is_hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteBlessing(blessing.id)}
                        title="حذف نهائي"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Albums Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Users className="h-5 w-5" />
            الألبومات الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            ميزة الألبومات الشخصية قريباً...
            <p className="text-sm mt-2">سيتمكن كل ضيف من إنشاء ألبوم شخصي خاص به</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}