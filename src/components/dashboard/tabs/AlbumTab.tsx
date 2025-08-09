import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Image, Trash2, Download, Eye } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  created_at: string;
  participant_name: string;
}

interface AlbumTabProps {
  token: string;
}

export function AlbumTab({ token }: AlbumTabProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [token]);

  const fetchPhotos = async () => {
    try {
      // Use dummy data since tables don't exist yet
      const dummyPhotos = [
        { id: "1", url: "/lovable-uploads/0200d767-58b7-4ed9-8589-ae65fa2df295.png", created_at: new Date().toISOString(), participant_name: "أحمد" },
        { id: "2", url: "/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png", created_at: new Date().toISOString(), participant_name: "فاطمة" },
        { id: "3", url: "/lovable-uploads/20d80c41-6fd7-4376-bc5d-1b8d9fac079f.png", created_at: new Date().toISOString(), participant_name: "محمد" },
      ];

      setPhotos(dummyPhotos);
    } catch (error) {
      toast({
        title: "خطأ في تحميل الصور",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;

    // Remove from dummy data
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    toast({ title: "تم حذف الصورة بنجاح" });
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            ألبوم الصور ({photos.length})
          </CardTitle>
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