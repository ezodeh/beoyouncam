import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MobilePreviewProps {
  welcomeTitle: string;
  welcomeBody: string;
  ctaLabel: string;
  showHeader: boolean;
  welcomePageHeroImage: string;
}

export function MobilePreview({ 
  welcomeTitle, 
  welcomeBody, 
  ctaLabel, 
  showHeader, 
  welcomePageHeroImage 
}: MobilePreviewProps) {
  return (
    <Tabs defaultValue="welcome" className="w-full max-w-xs">
      <TabsList className="grid w-full grid-cols-3 text-xs">
        <TabsTrigger value="welcome" className="text-xs">الترحيب</TabsTrigger>
        <TabsTrigger value="album-intro" className="text-xs">ترحيب الألبوم</TabsTrigger>
        <TabsTrigger value="album" className="text-xs">الألبوم</TabsTrigger>
      </TabsList>
      
      <TabsContent value="welcome">
        <div className="relative w-full h-[500px] bg-background border-8 border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-slate-800 rounded-b-lg"></div>
          <div className="h-full overflow-y-auto">
            <div className="min-h-full bg-background text-foreground flex flex-col" dir="rtl">
              {/* هيدر شرطي */}
              {showHeader && (
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
                  {welcomePageHeroImage ? (
                    <img 
                      src={welcomePageHeroImage} 
                      alt="صورة الغلاف" 
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
                </div>
              </figure>
              
              {/* المحتوى الرئيسي */}
              <main className="px-3 py-2 flex-1 grid place-items-center">
                <section className="max-w-full mx-auto">
                  <div className="text-center mb-4">
                    <h1 className="font-nastaliq text-sm leading-snug font-bold">
                      {welcomeTitle || "عنوان الحدث"}
                    </h1>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {welcomeBody || "يا هلا بكم"}
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
                      {ctaLabel || "ابدأ"}
                    </button>
                  </div>
                  
                  {/* خط الفاصل */}
                  <div className="my-3 flex items-center gap-2">
                    <div className="h-px bg-border flex-1" />
                    <span className="text-xs text-muted-foreground">أو</span>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  
                  {/* زر Google */}
                  <div className="w-full h-5 bg-muted rounded text-xs flex items-center justify-center">التسجيل بـ Google</div>
                </section>
              </main>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="album-intro">
        <div className="relative w-full h-[500px] bg-background border-8 border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-slate-800 rounded-b-lg"></div>
          <div className="h-full overflow-y-auto">
            <div className="min-h-full bg-background text-foreground flex flex-col" dir="rtl">
              {/* هيدر شرطي */}
              {showHeader && (
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
                  {welcomePageHeroImage ? (
                    <img 
                      src={welcomePageHeroImage} 
                      alt="صورة الغلاف" 
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
                </div>
              </figure>
              
              {/* المحتوى الرئيسي */}
              <main className="px-3 py-2 flex-1 grid place-items-center">
                <section className="max-w-full mx-auto text-center">
                  <h1 className="font-nastaliq text-sm leading-snug font-bold mb-2">
                    {welcomeTitle || "عنوان الحدث"}
                  </h1>
                  <p className="text-xs text-muted-foreground mb-4">
                    {welcomeBody || "يا هلا بكم"}
                  </p>
                  
                  <div className="space-y-2">
                    <button className="w-full h-8 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                      استعراض الألبوم
                    </button>
                    <button className="w-full h-8 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                      شارك صورك
                    </button>
                  </div>
                </section>
              </main>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="album">
        <div className="relative w-full h-[500px] bg-background border-8 border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-slate-800 rounded-b-lg"></div>
          <div className="h-full overflow-y-auto">
            <div className="min-h-full bg-background text-foreground flex flex-col" dir="rtl">
              {/* هيدر شرطي */}
              {showHeader && (
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
                <div className="relative h-16">
                  {welcomePageHeroImage ? (
                    <img 
                      src={welcomePageHeroImage} 
                      alt="صورة الغلاف" 
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60" />
                  <div className="absolute bottom-1 right-2">
                    <h2 className="text-xs font-bold text-white">
                      {welcomeTitle || "الألبوم"}
                    </h2>
                  </div>
                </div>
              </figure>
              
              {/* شبكة الصور الوهمية */}
              <main className="px-2 py-2 flex-1">
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-muted rounded-sm animate-pulse" />
                  ))}
                </div>
              </main>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}