import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Eye, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CustomizationTabProps {
  token: string;
  eventData: any;
  onEventUpdate: () => void;
}

interface PageCustomization {
  welcome_page_hero_image?: string;
  welcome_page_title?: string;
  welcome_page_description?: string;
  welcome_page_button_text?: string;
  album_welcome_hero_image?: string;
  album_welcome_title?: string;
  album_welcome_description?: string;
  album_page_hero_image?: string;
  album_page_title?: string;
}

export function CustomizationTab({ token, eventData, onEventUpdate }: CustomizationTabProps) {
  const [customization, setCustomization] = useState<PageCustomization>({});
  const [loading, setLoading] = useState(false);
  const [selectedPage, setSelectedPage] = useState("welcome");

  useEffect(() => {
    if (eventData) {
      setCustomization({
        welcome_page_hero_image: eventData.cover_url || "",
        welcome_page_title: eventData.title || "",
        welcome_page_description: eventData.description || "",
        welcome_page_button_text: "ابدأ",
        album_welcome_hero_image: eventData.album_cover_url || "",
        album_welcome_title: eventData.album_title || "الألبوم",
        album_welcome_description: eventData.album_description || "",
        album_page_hero_image: eventData.album_cover_url || "",
        album_page_title: eventData.album_title || "الألبوم",
      });
    }
  }, [eventData]);

  const handleImageUpload = async (file: File, field: keyof PageCustomization) => {
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${token}/${field}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('event-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-assets')
        .getPublicUrl(fileName);

      setCustomization(prev => ({ ...prev, [field]: publicUrl }));
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("فشل في رفع الصورة");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: any = {};
      
      // Map customization fields to database fields
      if (customization.welcome_page_hero_image) updateData.cover_url = customization.welcome_page_hero_image;
      if (customization.welcome_page_title) updateData.title = customization.welcome_page_title;
      if (customization.welcome_page_description) updateData.description = customization.welcome_page_description;
      if (customization.album_welcome_hero_image) updateData.album_cover_url = customization.album_welcome_hero_image;
      if (customization.album_welcome_title) updateData.album_title = customization.album_welcome_title;
      if (customization.album_welcome_description) updateData.album_description = customization.album_welcome_description;
      if (customization.album_page_hero_image && !updateData.album_cover_url) updateData.album_cover_url = customization.album_page_hero_image;
      if (customization.album_page_title && !updateData.album_title) updateData.album_title = customization.album_page_title;

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('token', token);

      if (error) throw error;

      toast.success("تم حفظ التخصيصات بنجاح");
      onEventUpdate();
    } catch (error) {
      console.error('Error saving customization:', error);
      toast.error("فشل في حفظ التخصيصات");
    } finally {
      setLoading(false);
    }
  };

  const PreviewPhone = ({ page }: { page: string }) => (
    <div className="w-64 mx-auto">
      <div className="relative w-full h-[500px] bg-background border-8 border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-slate-800 rounded-b-lg"></div>
        <div className="h-full overflow-y-auto">
          {page === "welcome" && (
            <div className="relative h-full flex flex-col" dir="rtl">
              <div className="relative h-48 overflow-hidden">
                {customization.welcome_page_hero_image && (
                  <img 
                    src={customization.welcome_page_hero_image} 
                    alt="صورة الترحيب" 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60"></div>
              </div>
              <div className="flex-1 p-4 text-center">
                <h1 className="text-lg font-bold mb-2">
                  {customization.welcome_page_title || "عنوان الحدث"}
                </h1>
                <p className="text-sm text-muted-foreground mb-4">
                  {customization.welcome_page_description || "وصف الحدث"}
                </p>
                <Button className="w-full rounded-full text-xs">
                  {customization.welcome_page_button_text || "ابدأ"}
                </Button>
              </div>
            </div>
          )}
          
          {page === "album-welcome" && (
            <div className="relative h-full flex flex-col" dir="rtl">
              <div className="relative h-48 overflow-hidden">
                {customization.album_welcome_hero_image && (
                  <img 
                    src={customization.album_welcome_hero_image} 
                    alt="صورة ترحيب الألبوم" 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60"></div>
              </div>
              <div className="flex-1 p-4 text-center">
                <h1 className="text-lg font-bold mb-2">
                  {customization.album_welcome_title || "مرحباً بكم في الألبوم"}
                </h1>
                <p className="text-sm text-muted-foreground mb-4">
                  {customization.album_welcome_description || "استعرض الصور الجميلة"}
                </p>
                <Button className="w-full rounded-full text-xs">دخول الألبوم</Button>
              </div>
            </div>
          )}
          
          {page === "album" && (
            <div className="relative h-full flex flex-col" dir="rtl">
              <div className="relative h-32 overflow-hidden">
                {customization.album_page_hero_image && (
                  <img 
                    src={customization.album_page_hero_image} 
                    alt="صورة الألبوم" 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60"></div>
              </div>
              <div className="p-3">
                <h1 className="text-sm font-bold mb-3 text-center">
                  {customization.album_page_title || "ألبوم الصور"}
                </h1>
                <div className="grid grid-cols-2 gap-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-square bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            تنسيق الصفحات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* التحكم */}
            <div className="space-y-6">
              <Tabs value={selectedPage} onValueChange={setSelectedPage}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="welcome">صفحة الترحيب</TabsTrigger>
                  <TabsTrigger value="album-welcome">ترحيب الألبوم</TabsTrigger>
                  <TabsTrigger value="album">صفحة الألبوم</TabsTrigger>
                </TabsList>

                <TabsContent value="welcome" className="space-y-4">
                  <div>
                    <Label>صورة الخلفية</Label>
                    <div className="mt-2">
                      <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
                        <div className="text-center">
                          <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">اختر صورة الخلفية</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'welcome_page_hero_image');
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="welcome-title">العنوان</Label>
                    <Input
                      id="welcome-title"
                      value={customization.welcome_page_title || ""}
                      onChange={(e) => setCustomization(prev => ({ ...prev, welcome_page_title: e.target.value }))}
                      placeholder="عنوان الحدث"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="welcome-desc">الوصف</Label>
                    <Textarea
                      id="welcome-desc"
                      value={customization.welcome_page_description || ""}
                      onChange={(e) => setCustomization(prev => ({ ...prev, welcome_page_description: e.target.value }))}
                      placeholder="وصف الحدث"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="welcome-button">نص الزر</Label>
                    <Input
                      id="welcome-button"
                      value={customization.welcome_page_button_text || ""}
                      onChange={(e) => setCustomization(prev => ({ ...prev, welcome_page_button_text: e.target.value }))}
                      placeholder="ابدأ"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="album-welcome" className="space-y-4">
                  <div>
                    <Label>صورة الخلفية</Label>
                    <div className="mt-2">
                      <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
                        <div className="text-center">
                          <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">اختر صورة الخلفية</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'album_welcome_hero_image');
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="album-welcome-title">العنوان</Label>
                    <Input
                      id="album-welcome-title"
                      value={customization.album_welcome_title || ""}
                      onChange={(e) => setCustomization(prev => ({ ...prev, album_welcome_title: e.target.value }))}
                      placeholder="مرحباً بكم في الألبوم"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="album-welcome-desc">الوصف</Label>
                    <Textarea
                      id="album-welcome-desc"
                      value={customization.album_welcome_description || ""}
                      onChange={(e) => setCustomization(prev => ({ ...prev, album_welcome_description: e.target.value }))}
                      placeholder="استعرض الصور الجميلة"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="album" className="space-y-4">
                  <div>
                    <Label>صورة الغلاف</Label>
                    <div className="mt-2">
                      <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
                        <div className="text-center">
                          <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">اختر صورة الغلاف</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'album_page_hero_image');
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="album-title">عنوان الألبوم</Label>
                    <Input
                      id="album-title"
                      value={customization.album_page_title || ""}
                      onChange={(e) => setCustomization(prev => ({ ...prev, album_page_title: e.target.value }))}
                      placeholder="ألبوم الصور"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>

            {/* المعاينة */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-center">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">المعاينة المباشرة</span>
              </div>
              <PreviewPhone page={selectedPage} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}