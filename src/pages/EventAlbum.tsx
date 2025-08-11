import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import coverImg from "@/assets/hero-mnaoyonkom.jpg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, ChevronLeft, ChevronRight, PartyPopper, Images, SquareStack, Share2, Heart, Users, ExternalLink, MessageSquare, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatShortDate } from "@/lib/dateUtils";
// سنجلب الوسائط من التخزين بدل البيانات التجريبية
interface MediaItem { url: string; type: "image" | "video"; createdAt?: string | null; name: string; participantName?: string; }


export default function EventAlbum() {
  const { token } = useParams();
  const location = useLocation();
  const eventName = new URLSearchParams(location.search).get("title") || "ألبوم المناسبة";
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>(eventName);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [isEventOwner, setIsEventOwner] = useState<boolean>(false);

  useEffect(() => {
    document.title = `الألبوم — ${title} — من عيونكم`;
  }, [title]);

  // تأكيد المرور بشاشة المقدمة أولاً
  useEffect(() => {
    if (!token) return;
    const seen = sessionStorage.getItem(`intro_${token}`);
    if (!seen) {
      navigate(`/album/${token}/intro?title=${encodeURIComponent(eventName)}`);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data: { session } } = await supabase.auth.getSession();
      const { data } = await supabase
        .from("events")
        .select("is_private, published_at, title, cover_url, show_header, owner_id, password, is_album_published")
        .eq("token", token)
        .maybeSingle();
      
      if (data) {
        setTitle(data.title || eventName);
        setCoverUrl(data.cover_url || null);
        setShowHeader(data.show_header !== false);
        
        // Determine if current user is the event owner
        const currentIsEventOwner = session?.user?.id === data.owner_id;
        setIsEventOwner(currentIsEventOwner);
        
        console.log("🔍 Album access check:", {
          isAlbumPublished: data.is_album_published,
          isEventOwner: currentIsEventOwner,
          userId: session?.user?.id,
          ownerId: data.owner_id
        });
        
        // Check if album is published OR user is the owner
        if (!data.is_album_published && !currentIsEventOwner) {
          console.log("🚫 Album not published and user is not owner, redirecting to soon page");
          navigate(`/event/${token}/soon?title=${encodeURIComponent(title)}`);
          return;
        }
        
        // Check if private and requires password
        if (data.is_private && data.password && !isEventOwner) {
          const hasAccess = sessionStorage.getItem(`album_access_${token}`);
          if (!hasAccess) {
            navigate(`/album/${token}/private${location.search}`);
            return;
          }
        }
      }
    })();
  }, [token, isEventOwner, location.search]);

  // وسائط الألبوم من التخزين
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState<boolean>(true);
  const { toast } = useToast();

  // مباركات وألبومات شخصية (بيانات مؤقتة حالياً)
  const [congratulations, setCongratulations] = useState<any[]>([]);
  const [newCongratulation, setNewCongratulation] = useState("");
  const [senderName, setSenderName] = useState("");
  const [personalAlbums, setPersonalAlbums] = useState<any[]>([]);
  const [showCongratsDialog, setShowCongratsDialog] = useState(false);
  const [activeCongrat, setActiveCongrat] = useState<any | null>(null);
  const [congratsIndex, setCongratIndex] = useState(0);

  useEffect(() => {
    // جلب المباركات الحقيقية من قاعدة البيانات
    const fetchBlessings = async () => {
      if (!token) return;
      try {
        const { data, error } = await supabase
          .from("blessings")
          .select("*")
          .eq("event_token", token)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setCongratulations(data || []);
      } catch (error) {
        console.error("Error fetching blessings:", error);
        setCongratulations([]);
      }
    };

    fetchBlessings();

    // جلب ألبومات المشاركين الحقيقية
    const fetchPersonalAlbums = async () => {
      if (!token) return;
      try {
        const { data: participantsData, error } = await supabase
          .from('participants')
          .select(`
            id, 
            name, 
            created_at,
            media_submissions!inner (
              id,
              file_path,
              media_type,
              created_at
            )
          `)
          .eq('event_token', token)
          .eq('media_submissions.media_type', 'image')
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        // تجميع المشاركين مع عدد صورهم وآخر صورة
        const albumsMap = new Map();
        participantsData?.forEach(participant => {
          const participantName = participant.name || 'مشارك';
          if (!albumsMap.has(participantName)) {
            albumsMap.set(participantName, {
              id: participant.id,
              person_name: participantName,
              photo_count: 0,
              latest_photo: null,
              latest_created_at: null
            });
          }
          
          const album = albumsMap.get(participantName);
          participant.media_submissions.forEach((submission: any) => {
            album.photo_count++;
            
            // تحديث آخر صورة
            if (!album.latest_created_at || new Date(submission.created_at) > new Date(album.latest_created_at)) {
              album.latest_created_at = submission.created_at;
              const { data: { publicUrl } } = supabase.storage
                .from("event-media")
                .getPublicUrl(submission.file_path);
              album.latest_photo = publicUrl;
            }
          });
        });
        
        const personalAlbumsData = Array.from(albumsMap.values())
          .filter(album => album.photo_count > 0)
          .sort((a, b) => a.person_name.localeCompare(b.person_name, 'ar'));
        
        setPersonalAlbums(personalAlbumsData);
      } catch (error) {
        console.error("Error fetching personal albums:", error);
        setPersonalAlbums([]);
      }
    };

    fetchPersonalAlbums();
  }, [token]);

  const addCongratulation = async () => {
    if (!newCongratulation.trim() || !senderName.trim()) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase.from("blessings").insert({
        event_token: token,
        name: senderName,
        content: newCongratulation
      }).select().single();
      
      if (error) throw error;
      
      setCongratulations((prev) => [{ ...data, sender_name: data.name, message: data.content }, ...prev]);
      setNewCongratulation("");
      setSenderName("");
      toast({ title: "تم إضافة المباركة", description: "شكراً لك" });
    } catch (error) {
      toast({ title: "خطأ", description: "تعذّر إضافة المباركة" });
    }
  };

  const deleteBlessings = async () => {
    const confirmed = confirm("⚠️ تحذير: هل أنت متأكد من حذف جميع المباركات نهائياً؟\n\nلا يمكن التراجع عن هذا الإجراء.");
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from("blessings")
        .delete()
        .eq("event_token", token);
      if (error) throw error;
      setCongratulations([]);
      toast({ title: "تم حذف جميع المباركات" });
    } catch (error) {
      toast({ title: "خطأ", description: "تعذّر حذف المباركات", variant: "destructive" });
    }
  };

  const deleteBlessing = async (blessingId: string) => {
    const confirmed = confirm("⚠️ هل أنت متأكد من حذف هذه المباركة نهائياً؟\n\nلا يمكن التراجع عن هذا الإجراء.");
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from("blessings")
        .delete()
        .eq("id", blessingId);
      if (error) throw error;
      setCongratulations(prev => prev.filter(c => c.id !== blessingId));
      toast({ title: "تم حذف المباركة" });
    } catch (error) {
      toast({ title: "خطأ", description: "تعذّر حذف المباركة", variant: "destructive" });
    }
  };

  const deleteAllMedia = async () => {
    // إضافة رسالة تأكيد مفصلة
    const confirmed = confirm("⚠️ تحذير: هل أنت متأكد من حذف جميع الصور والفيديوهات نهائياً؟\n\nهذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع الوسائط من التخزين ومن قاعدة البيانات.");
    if (!confirmed) return;
    try {
      // حذف سجلات media_submissions أولاً للحصول على file_paths
      const { data: submissions, error: fetchError } = await supabase
        .from("media_submissions")
        .select("file_path")
        .eq("event_token", token);
      
      if (fetchError) throw fetchError;

      // حذف الملفات من التخزين
      if (submissions && submissions.length > 0) {
        const filePaths = submissions.map(s => s.file_path);
        const { error: storageError } = await supabase.storage
          .from("event-media")
          .remove(filePaths);
        
        if (storageError) throw storageError;
      }

      // حذف سجلات media_submissions
      const { error: dbError } = await supabase
        .from("media_submissions")
        .delete()
        .eq("event_token", token);
        
      if (dbError) throw dbError;

      // تحديث الحالة المحلية
      setMedia([]);
      toast({ title: "تم حذف جميع الوسائط نهائياً" });
    } catch (error) {
      toast({ title: "خطأ", description: "تعذّر حذف الوسائط", variant: "destructive" });
    }
  };

  const deleteMediaItem = async (mediaItem: MediaItem) => {
    const confirmed = confirm("⚠️ هل أنت متأكد من حذف هذه الصورة نهائياً؟\n\nلا يمكن التراجع عن هذا الإجراء.");
    if (!confirmed) return;
    
    try {
      console.log("🗑️ بدء حذف الصورة:", mediaItem.name);
      
      // أولاً: حذف من قاعدة البيانات للحصول على file_path
      const { data: submission, error: fetchError } = await supabase
        .from("media_submissions")
        .select("file_path, id")
        .eq("file_name", mediaItem.name)
        .eq("event_token", token)
        .maybeSingle();
      
      if (fetchError) {
        console.error("خطأ في جلب بيانات الملف:", fetchError);
        throw fetchError;
      }
      
      if (!submission) {
        console.log("⚠️ لم يتم العثور على الملف في قاعدة البيانات");
        toast({ title: "خطأ", description: "لم يتم العثور على الملف", variant: "destructive" });
        return;
      }
      
      console.log("📄 بيانات الملف:", submission);

      // ثانياً: حذف من قاعدة البيانات
      const { error: dbError } = await supabase
        .from("media_submissions")
        .delete()
        .eq("id", submission.id);
        
      if (dbError) {
        console.error("خطأ في حذف من قاعدة البيانات:", dbError);
        throw dbError;
      }
      
      console.log("✅ تم حذف السجل من قاعدة البيانات");

      // ثالثاً: حذف من التخزين
      const { error: storageError } = await supabase.storage
        .from("event-media")
        .remove([submission.file_path]);
      
      if (storageError) {
        console.error("خطأ في حذف من التخزين:", storageError);
        // لا نرمي الخطأ هنا لأن المهم هو حذف السجل من قاعدة البيانات
        console.log("⚠️ تم حذف السجل من قاعدة البيانات لكن فشل حذف الملف من التخزين");
      } else {
        console.log("✅ تم حذف الملف من التخزين");
      }

      // رابعاً: تحديث الواجهة المحلية
      setMedia(prev => prev.filter(m => m.name !== mediaItem.name));
      
      // إغلاق الـ lightbox إذا كانت الصورة المحذوفة معروضة
      if (lightboxIndex !== null && imageItems[lightboxIndex]?.name === mediaItem.name) {
        setLightboxIndex(null);
      }
      
      toast({ title: "تم حذف الصورة نهائياً" });
      console.log("✅ تم إكمال عملية الحذف بنجاح");
      
    } catch (error) {
      console.error("❌ خطأ في حذف الصورة:", error);
      toast({ title: "خطأ", description: "تعذّر حذف الصورة", variant: "destructive" });
    }
  };

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoadingMedia(true);
      try {
        const prefix = `events/${token}`;
        
        // جلب الملفات من التخزين
        const { data: files, error } = await supabase.storage
          .from("event-media")
          .list(prefix, { limit: 1000, sortBy: { column: "created_at", order: "asc" } as any });
        if (error) throw error;

        // جلب معلومات المشاركين مع الملفات
        const { data: mediaSubmissions } = await supabase
          .from("media_submissions")
          .select(`
            file_name,
            participants!inner (
              name
            )
          `)
          .eq("event_token", token);

        // إنشاء خريطة لربط أسماء الملفات بأسماء المشاركين
        const participantMap = new Map();
        mediaSubmissions?.forEach(submission => {
          participantMap.set(submission.file_name, submission.participants.name);
        });

        const items: MediaItem[] = (files || [])
          .filter((f: any) => !String(f.name || "").startsWith("."))
          .map((f: any) => {
            const { data: pub } = supabase.storage.from("event-media").getPublicUrl(`${prefix}/${f.name}`);
            const ext = String(f.name || "").split(".").pop()?.toLowerCase() || "";
            const type: "image" | "video" = ["jpg","jpeg","png","webp","gif","heic","heif","avif"].includes(ext) ? "image" : "video";
            const participantName = participantMap.get(f.name) || "مشارك";
            
            return { 
              url: pub.publicUrl, 
              type, 
              createdAt: (f as any).created_at ?? null, 
              name: f.name,
              participantName
            };
          });
          
        items.sort((a,b)=> (a.createdAt && b.createdAt) ? (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : a.name.localeCompare(b.name));
        setMedia(items);
      } catch (_) {
        toast({ title: "تعذّر تحميل الوسائط" });
      } finally {
        setLoadingMedia(false);
      }
    })();
  }, [token]);

  // عارض الصور (فول سكرين)
  const imageItems = media.filter((m)=>m.type === "image");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () => setLightboxIndex((idx) => (idx === null ? null : (idx + 1) % imageItems.length));
  const prevImage = () => setLightboxIndex((idx) => (idx === null ? null : (idx - 1 + imageItems.length) % imageItems.length));
  // سوايب رأسي مثل تيكتوك
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const handleTouchStart = (e: any) => { setTouchStartY(e.touches?.[0]?.clientY ?? null); };
  const handleTouchEnd = (e: any) => {
    if (touchStartY === null) return;
    const dy = (e.changedTouches?.[0]?.clientY ?? touchStartY) - touchStartY;
    if (Math.abs(dy) > 50) { if (dy < 0) nextImage(); else prevImage(); }
    setTouchStartY(null);
  };

  const shareCurrent = async () => {
    if (lightboxIndex === null) return;
    const shareUrl = window.location.href;
    const t = `الألبوم — ${title}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: t, url: shareUrl }); } catch (_) {}
    } else {
      try { await navigator.clipboard.writeText(shareUrl); toast({ title: "تم نسخ رابط المشاركة" }); } catch (_) {}
    }
  };

  const shareAlbum = async () => {
    const shareUrl = window.location.href;
    const t = `الألبوم — ${title}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: t, url: shareUrl }); } catch (_) {}
    } else {
      try { await navigator.clipboard.writeText(shareUrl); toast({ title: "تم نسخ رابط المشاركة" }); } catch (_) {}
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      {showHeader && (
        <Navbar />
      )}
      <main className="flex-1">
        <header className="relative">
          <figure className="h-44 sm:h-56 md:h-64 w-full overflow-hidden">
            <img
              src={coverUrl || coverImg}
              alt={`غلاف ${title}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </figure>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/10 pointer-events-none" />
          <div className="absolute top-3 left-3 z-20">
            <Button size="sm" variant="outline" className="rounded-full" onClick={shareAlbum} aria-label="مشاركة الألبوم">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">مشاركة</span>
            </Button>
          </div>
          <div className="absolute inset-x-0 bottom-0">
            <div className="container mx-auto px-4 py-4">
              <h1 className="font-nastaliq text-3xl sm:text-4xl font-extrabold text-right">الألبوم — {title}</h1>
              
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-6">
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-xl rounded-full mx-auto">
              <TabsTrigger value="congratulations" aria-label="المباركات" className="flex items-center justify-center sm:justify-start gap-0 sm:gap-2">
                <Heart className="h-5 w-5" />
                <span className="hidden sm:inline">المباركات</span>
              </TabsTrigger>
              <TabsTrigger value="photos" aria-label="الصور" className="flex items-center justify-center sm:justify-start gap-0 sm:gap-2">
                <Images className="h-5 w-5" />
                <span className="hidden sm:inline">الصور</span>
              </TabsTrigger>
              <TabsTrigger value="albums" aria-label="بعيون الأحباب" className="flex items-center justify-center sm:justify-start gap-0 sm:gap-2">
                <Users className="h-5 w-5" />
                <span className="hidden sm:inline">بعيون الأحباب</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="mt-6">
              <div className="max-w-5xl mx-auto">
                {isEventOwner && imageItems.length > 0 && (
                  <div className="mb-4 flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteAllMedia}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف جميع الصور
                    </Button>
                  </div>
                )}
                {loadingMedia ? (
                  <div className="text-center text-sm text-muted-foreground py-10">جارٍ تحميل الصور…</div>
                ) : imageItems.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-10">لا توجد صور بعد</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                    {imageItems.map((it, idx) => (
                      <div key={it.name + idx} className="relative group">
                        <button
                          className="aspect-square overflow-hidden rounded-md border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-ring w-full"
                          onClick={() => setLightboxIndex(idx)}
                          aria-label={`عرض الصورة رقم ${idx + 1}`}
                        >
                          <img src={it.url} alt={`صورة ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                        </button>
                        {isEventOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMediaItem(it);
                            }}
                            className="absolute top-1 left-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="حذف الصورة"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                           <button 
                             className="text-white text-xs text-right font-medium hover:underline"
                             onClick={(e) => {
                               e.stopPropagation();
                               navigate(`/album/${token}/by/${encodeURIComponent(it.participantName)}`);
                             }}
                           >
                             {it.participantName}
                           </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="congratulations" className="mt-6">
              <div className="space-y-6 max-w-3xl mx-auto">
                {isEventOwner && congratulations.length > 0 && (
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteBlessings}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف جميع المباركات
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" dir="rtl">
                  {congratulations.length === 0 ? (
                    <div className="col-span-full text-center text-sm text-muted-foreground py-10">
                      لا توجد مباركات بعد
                    </div>
                  ) : (
                    congratulations.map((cong) => (
                      <Card key={cong.id} className="cursor-pointer relative group" onClick={() => { 
                        const idx = congratulations.findIndex(c => c.id === cong.id);
                        setCongratIndex(idx);
                        setActiveCongrat(cong); 
                        setShowCongratsDialog(true); 
                      }}>
                        <CardContent className="p-4">
                          {isEventOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBlessing(cong.id);
                              }}
                              className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="حذف المباركة"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-semibold">
                              {(cong.sender_name || cong.name || "؟").charAt(0)}
                            </div>
                            <div className="flex-1 text-right">
                              <h4 className="font-semibold text-foreground">{cong.sender_name || cong.name}</h4>
                              <p className="text-muted-foreground mt-1 leading-relaxed text-sm">{cong.message || cong.content}</p>
                              <span className="text-xs text-muted-foreground">{formatShortDate(cong.created_at)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* زر عائم لإضافة مباركة - يسار الشاشة */}
                <button
                  className="fixed bottom-20 left-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center"
                  onClick={() => setShowCongratsDialog(true)}
                  aria-label="إضافة مباركة"
                >
                  <Plus className="h-6 w-6" />
                </button>

                {/* نافذة إضافة مباركة */}
                <Dialog open={showCongratsDialog} onOpenChange={setShowCongratsDialog}>
                  <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إضافة مباركة</DialogTitle>
                      <DialogDescription>اكتب اسمك ورسالتك اللطيفة</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input placeholder="اسمك" value={senderName} onChange={(e) => setSenderName(e.target.value)} className="text-right" />
                      <Textarea placeholder="اكتب مباركتك هنا..." value={newCongratulation} onChange={(e) => setNewCongratulation(e.target.value)} className="text-right min-h-[120px]" />
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => { addCongratulation(); setShowCongratsDialog(false); }}>إرسال</Button>
                        <Button variant="outline" className="flex-1" onClick={() => setShowCongratsDialog(false)}>إلغاء</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* نافذة عرض نص المباركة كاملاً مع تنقّل */}
                <Dialog open={!!activeCongrat} onOpenChange={(o) => { if (!o) { setActiveCongrat(null); setCongratIndex(0); } }}>
                  <DialogContent className="sm:max-w-lg" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        <span>{activeCongrat?.sender_name}</span>
                        <span className="text-sm text-muted-foreground">{congratsIndex + 1} / {congratulations.length}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="text-right text-foreground leading-relaxed min-h-[80px]">
                      {activeCongrat?.message}
                    </div>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const newIndex = (congratsIndex - 1 + congratulations.length) % congratulations.length;
                          setCongratIndex(newIndex);
                          setActiveCongrat(congratulations[newIndex]);
                        }}
                        disabled={congratulations.length <= 1}
                      >
                        السابق
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const newIndex = (congratsIndex + 1) % congratulations.length;
                          setCongratIndex(newIndex);
                          setActiveCongrat(congratulations[newIndex]);
                        }}
                        disabled={congratulations.length <= 1}
                      >
                        التالي
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>

            <TabsContent value="albums" className="mt-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 max-w-4xl mx-auto">
                {personalAlbums.map((album) => (
                  <div key={album.id} className="relative group">
                    <Link
                      to={`/album/${token}/by/${encodeURIComponent(album.person_name)}`}
                      className="group block"
                      aria-label={`عرض ألبوم ${album.person_name}`}
                    >
                      <Card className="group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-200">
                        <CardContent className="p-3">
                          <div className="aspect-square overflow-hidden rounded-lg bg-muted mb-2">
                            <img
                              src={album.latest_photo}
                              alt={`آخر صورة من ألبوم ${album.person_name}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <h3 className="font-semibold text-center">{album.person_name}</h3>
                          <p className="text-xs text-muted-foreground text-center">{album.photo_count} صورة</p>
                        </CardContent>
                      </Card>
                    </Link>
                    {isEventOwner && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`هل أنت متأكد من حذف جميع صور ${album.person_name}؟`)) {
                            // حذف الألبوم الشخصي
                            setPersonalAlbums(prev => prev.filter(a => a.id !== album.id));
                            toast({ title: `تم حذف ألبوم ${album.person_name}` });
                          }
                        }}
                        className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`حذف ألبوم ${album.person_name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {lightboxIndex !== null && (
         <div
           className="fixed inset-0 z-50 bg-black/90 text-white"
           dir="rtl"
           tabIndex={-1}
           onKeyDown={(e) => { if (e.key === "Escape") closeLightbox(); }}
           onTouchStart={handleTouchStart}
           onTouchEnd={handleTouchEnd}
         >
          <button
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            aria-label="إغلاق"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute top-4 right-16 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); shareCurrent(); }}
            aria-label="مشاركة"
          >
            <Share2 className="h-6 w-6" />
          </button>

          <div className="absolute top-4 left-4 text-sm">{String(lightboxIndex + 1).padStart(2, "0")}/{imageItems.length}</div>
          
          {/* إضافة زر حذف للمنشئ في وضع ملء الشاشة */}
          {isEventOwner && (
            <button
              className="absolute top-4 right-28 z-20 p-2 rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation();
                deleteMediaItem(imageItems[lightboxIndex]);
                closeLightbox();
              }}
              aria-label="حذف الصورة"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}

          <div className="h-full w-full flex items-center justify-center p-4">
            <img src={imageItems[lightboxIndex!].url} alt={`صورة رقم ${lightboxIndex! + 1}`} className="max-h-full max-w-full object-contain" />
          </div>
          
           {/* اسم المصور */}
           <div className="absolute bottom-6 right-6 bg-black/70 text-white px-3 py-2 rounded-lg">
             <button 
               className="font-nastaliq text-lg hover:underline" 
               onClick={() => {
                 closeLightbox();
                 navigate(`/album/${token}/by/${encodeURIComponent(imageItems[lightboxIndex].participantName)}`);
               }}
             >
               بعيون: {imageItems[lightboxIndex].participantName}
             </button>
           </div>

          <div className="absolute inset-y-0 start-0 z-10 flex items-center p-4">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={prevImage} aria-label="السابق">
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>
          <div className="absolute inset-y-0 end-0 z-10 flex items-center p-4">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={nextImage} aria-label="التالي">
              <ChevronLeft className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}

      {showHeader && (
        <Footer />
      )}
    </div>
  );
}
