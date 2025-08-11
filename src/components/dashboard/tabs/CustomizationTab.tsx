import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Eye, Smartphone, Heart, Images, Users, Edit, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImageEditor } from "@/components/ui/image-editor";

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
  show_header?: boolean;
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
        show_header: eventData.show_header !== false,
      });
    }
  }, [eventData]);

  const handleImageUpload = async (file: File, field: keyof PageCustomization) => {
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${token}/${field}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('event-customization')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-customization')
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
      if (typeof customization.show_header === 'boolean') updateData.show_header = customization.show_header;

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
            <div className="min-h-full bg-background text-foreground flex flex-col" dir="rtl">
              {/* هيدر شرطي */}
              {customization.show_header !== false && (
                <>
                  {/* شريط التنقل */}
                  <nav className="w-full bg-background border-b px-2 py-1">
                    <div className="flex items-center justify-between">
                      <img src="/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png" alt="عيون cam" className="h-3 w-auto" />
                      <div className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-center">دخول</div>
                    </div>
                  </nav>
                  <div className="brand-strip w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                </>
              )}
              
              {/* صورة البطل */}
              <figure className="relative w-full mb-1 overflow-hidden bg-secondary rounded-none">
                <div className="relative h-32">
                  {customization.welcome_page_hero_image ? (
                    <img 
                      src={customization.welcome_page_hero_image} 
                      alt="صورة الترحيب" 
                      className="absolute inset-0 h-full w-full object-cover kenburns-slow"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
                  
                  {/* زر المشاركة */}
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-background/70 backdrop-blur shadow-elevated flex items-center justify-center">
                    <div className="w-2 h-2 bg-foreground rounded-sm opacity-60" />
                  </div>
                </div>
              </figure>
              
              {/* المحتوى الرئيسي */}
              <main className="px-3 py-2 flex-1 grid place-items-center">
                <section className="max-w-full mx-auto">
                  <div className="text-center mb-4">
                    <h1 className="font-nastaliq text-sm leading-snug font-bold">
                      {customization.welcome_page_title || "عنوان الحدث"}
                    </h1>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {customization.welcome_page_description || "يا هلا بكم"}
                    </p>
                  </div>
                  
                  {/* نموذج التسجيل */}
                  <div className="w-full space-y-2">
                    <div>
                      <div className="text-xs mb-1 text-right text-muted-foreground">الاسم</div>
                      <div className="h-6 bg-muted border rounded text-xs flex items-center px-2">اسمك</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <div className="text-xs mb-1 text-right text-muted-foreground">المقدمة</div>
                        <div className="h-6 bg-muted border rounded text-xs flex items-center justify-center">+970</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs mb-1 text-right text-muted-foreground">الهاتف</div>
                        <div className="h-6 bg-muted border rounded text-xs flex items-center px-2" dir="ltr">5XXXXXXX</div>
                      </div>
                    </div>
                    <button className="w-full h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium mt-2">
                      {customization.welcome_page_button_text || "ابدأ"}
                    </button>
                  </div>
                  
                  {/* خط الفاصل */}
                  <div className="my-3 flex items-center gap-2">
                    <div className="h-px bg-border flex-1" />
                    <span className="text-xs text-muted-foreground">أو</span>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  
                  {/* زر Google */}
                  <button className="w-full h-6 bg-secondary text-secondary-foreground rounded-full text-xs">
                    <span dir="ltr">Google</span> المتابعة بحساب
                  </button>
                  
                  {/* زر إنشاء حساب */}
                  <div className="mt-2 text-center">
                    <button className="h-6 bg-transparent border border-border text-foreground rounded-full text-xs px-3">
                      تسجيل/إنشاء حساب بالبريد
                    </button>
                  </div>
                </section>
              </main>
            </div>
          )}
          
          {page === "album-welcome" && (
            <div className="min-h-full bg-background text-foreground flex flex-col" dir="rtl">
              {/* هيدر شرطي */}
              {customization.show_header !== false && (
                <>
                  <nav className="w-full bg-background border-b px-2 py-1">
                    <div className="flex items-center justify-between">
                      <img src="/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png" alt="عيون cam" className="h-3 w-auto" />
                      <div className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-center">دخول</div>
                    </div>
                  </nav>
                  <div className="brand-strip w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                </>
              )}
              
              {/* صورة الغلاف */}
              <figure className="relative w-full mb-1 overflow-hidden bg-secondary rounded-none">
                <div className="relative h-20">
                  {customization.album_welcome_hero_image ? (
                    <img 
                      src={customization.album_welcome_hero_image} 
                      alt="غلاف الألبوم" 
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
                </div>
              </figure>
              
              {/* المحتوى */}
              <main className="px-3 py-2 flex-1 grid place-items-center">
                <section className="max-w-full mx-auto text-center">
                  <h1 className="font-nastaliq text-sm leading-snug font-bold">
                    ألبوم {customization.album_welcome_title || "الحدث"}
                  </h1>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {customization.album_welcome_description || "يسعدنا وجودكم — تفضّلوا للدخول إلى الألبوم."}
                  </p>
                  <div className="mt-4">
                    <button className="h-6 bg-primary text-primary-foreground rounded-full text-xs px-6">
                      الدخول إلى الألبوم
                    </button>
                  </div>
                </section>
              </main>
            </div>
          )}
          
          {page === "album" && (
            <div className="min-h-full bg-background text-foreground flex flex-col" dir="rtl">
              {/* هيدر شرطي */}
              {customization.show_header !== false && (
                <>
                  <nav className="w-full bg-background border-b px-2 py-1">
                    <div className="flex items-center justify-between">
                      <img src="/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png" alt="عيون cam" className="h-3 w-auto" />
                      <div className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-center">دخول</div>
                    </div>
                  </nav>
                  <div className="brand-strip w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                </>
              )}
              
              <main className="flex-1">
                {/* هيدر الألبوم */}
                <header className="relative">
                  <figure className="h-24 w-full overflow-hidden">
                    {customization.album_page_hero_image ? (
                      <img 
                        src={customization.album_page_hero_image} 
                        alt="غلاف الألبوم" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full bg-muted" />
                    )}
                  </figure>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/10 pointer-events-none" />
                  
                  {/* زر المشاركة */}
                  <div className="absolute top-1 left-1 z-20">
                    <div className="w-5 h-5 bg-background/70 border border-border rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-foreground rounded-sm opacity-60" />
                    </div>
                  </div>
                  
                  {/* عنوان الألبوم */}
                  <div className="absolute inset-x-0 bottom-0">
                    <div className="px-2 py-1">
                      <h1 className="font-nastaliq text-xs font-bold text-right text-white">
                        الألبوم — {customization.album_page_title || "ألبوم الصور"}
                      </h1>
                    </div>
                  </div>
                </header>
                
                {/* محتوى الألبوم */}
                <section className="px-3 py-3">
                  {/* تبويبات الألبوم */}
                  <div className="grid grid-cols-3 w-full max-w-full rounded-full mx-auto bg-muted p-0.5 mb-3">
                    <div className="flex items-center justify-center text-xs py-1 rounded-full">
                      <Heart className="w-3 h-3" />
                    </div>
                    <div className="flex items-center justify-center text-xs py-1 rounded-full bg-background">
                      <Images className="w-3 h-3" />
                    </div>
                    <div className="flex items-center justify-center text-xs py-1 rounded-full">
                      <Users className="w-3 h-3" />
                    </div>
                  </div>
                  
                  {/* شبكة الصور */}
                  <div className="max-w-full mx-auto">
                    <div className="grid grid-cols-3 gap-0.5">
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="relative aspect-square overflow-hidden rounded border border-border bg-muted">
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                            <div className="text-white text-xs text-right font-medium opacity-80">مشارك</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </main>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            تنسيق الصفحات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* الاستعراض - يظهر أولاً في الموبايل */}
            <div className="order-1 lg:order-2">
              <div className="sticky top-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">الاستعراض</h3>
                  <PreviewPhone page={selectedPage} />
                </div>
              </div>
            </div>
            
            {/* التحكم - يظهر ثانياً في الموبايل */}
            <div className="order-2 lg:order-1 space-y-6">
              <Tabs value={selectedPage} onValueChange={setSelectedPage}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="welcome">صفحة الترحيب</TabsTrigger>
                  <TabsTrigger value="album-welcome">ترحيب الألبوم</TabsTrigger>
                  <TabsTrigger value="album">صفحة الألبوم</TabsTrigger>
                </TabsList>

                <TabsContent value="welcome" className="space-y-4">
                  <div>
                    <Label>صورة الخلفية</Label>
                    <div className="mt-2 space-y-2">
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
                      {customization.welcome_page_hero_image && (
                        <ImageEditor
                          src={customization.welcome_page_hero_image}
                          onImageChange={(newSrc) => setCustomization(prev => ({ ...prev, welcome_page_hero_image: newSrc }))}
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 ml-2" />
                            تحرير الصورة
                          </Button>
                        </ImageEditor>
                      )}
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
                    <div className="mt-2 space-y-2">
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
                      {customization.album_welcome_hero_image && (
                        <ImageEditor
                          src={customization.album_welcome_hero_image}
                          onImageChange={(newSrc) => setCustomization(prev => ({ ...prev, album_welcome_hero_image: newSrc }))}
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 ml-2" />
                            تحرير الصورة
                          </Button>
                        </ImageEditor>
                      )}
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
                    <div className="mt-2 space-y-2">
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
                      {customization.album_page_hero_image && (
                        <ImageEditor
                          src={customization.album_page_hero_image}
                          onImageChange={(newSrc) => setCustomization(prev => ({ ...prev, album_page_hero_image: newSrc }))}
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 ml-2" />
                            تحرير الصورة
                          </Button>
                        </ImageEditor>
                      )}
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

              {/* إعدادات عامة - ميزة البريميوم */}
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
                    <Star className="inline-block ml-2" size={16} /> إعدادات البريميوم
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">إظهار الهيدر</Label>
                      <p className="text-xs text-muted-foreground">
                        تحكم في إظهار أو إخفاء الهيدر في جميع الصفحات
                      </p>
                    </div>
                    <Switch
                      checked={customization.show_header !== false}
                      onCheckedChange={(checked) => 
                        setCustomization(prev => ({ ...prev, show_header: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}