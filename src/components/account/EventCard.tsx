import { useState } from "react";
import { Link } from "react-router-dom";
import { Image, Camera, Share2, Settings, MoreVertical, QrCode, Download, AlertCircle, X } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-mnaoyonkom.jpg";
interface EventItem {
  token: string;
  title: string;
  cover_url: string | null;
}
interface EventCardProps {
  event: EventItem;
  linkTo: string;
  subtitle: string;
  isOwner?: boolean;
  isPast?: boolean;
  onEventDeleted?: () => void;
}
export default function EventCard({
  event,
  linkTo,
  subtitle,
  isOwner,
  isPast,
  onEventDeleted
}: EventCardProps) {
  const {
    toast
  } = useToast();
  const [qrOpen, setQrOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const svgId = `qr-svg-${event.token}`;
  const shareUrl = `${window.location.origin}/event/${event.token}`;
  const albumUrl = `${window.location.origin}/album/${event.token}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "تم نسخ الرابط",
        description: "يمكنك الآن مشاركته"
      });
    } catch {
      toast({
        title: "تعذّر نسخ الرابط",
        description: shareUrl,
        variant: "destructive"
      });
    }
  };
  const downloadQrSvg = () => {
    const svg = document.querySelector<SVGSVGElement>(`#${svgId}`);
    if (!svg) {
      toast({
        title: "تعذّر العثور على الباركود",
        variant: "destructive"
      });
      return;
    }

    // Clone and enhance the SVG
    const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

    // Set larger dimensions and proper viewBox
    const size = 1024;
    clonedSvg.setAttribute("width", size.toString());
    clonedSvg.setAttribute("height", size.toString());
    clonedSvg.setAttribute("viewBox", `0 0 ${size} ${size}`);

    // Ensure proper background
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", "white");
    clonedSvg.insertBefore(rect, clonedSvg.firstChild);
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(clonedSvg);
    const blob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-${event.token}-qr-large.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({
      title: "تم تنزيل الباركود SVG بحجم كبير"
    });
  };
  const downloadQrPng = () => {
    const svg = document.querySelector<SVGSVGElement>(`#${svgId}`);
    if (!svg) {
      toast({
        title: "تعذّر العثور على الباركود",
        variant: "destructive"
      });
      return;
    }

    // Create a high-resolution canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set ultra high resolution (8x for maximum quality)
    const scale = 8;
    const size = 1024; // Larger base size (1024x1024)
    canvas.width = size * scale; // Final: 8192x8192 pixels
    canvas.height = size * scale;

    // Scale the context for ultra high DPI
    ctx.scale(scale, scale);
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8"
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = document.createElement("img");
    img.onload = () => {
      // Fill white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      // Draw the QR code
      ctx.drawImage(img, 0, 0, size, size);

      // Convert to PNG and download
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `event-${event.token}-qr-ultra-hd.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(svgUrl);
        toast({
          title: "تم تنزيل الباركود بجودة فائقة PNG (8K)"
        });
      }, "image/png", 1.0);
    };
    img.src = svgUrl;
  };
  const downloadAlbum = async () => {
    setDownloading(true);
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive"
        });
        return;
      }
      const response = await supabase.functions.invoke('download-album', {
        body: JSON.stringify({
          token: event.token
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.error) {
        throw new Error(response.error.message);
      }

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/zip'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.title}_${event.token}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "تم تنزيل الألبوم بنجاح"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "خطأ في التنزيل",
        description: "تعذّر تنزيل الألبوم. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };
  const webShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "تم نسخ الرابط",
          description: "ميزة Web Share غير مدعومة"
        });
      }
    } catch {
      // ignored
    }
  };
  const deleteEvent = async () => {
    const firstConfirm = window.confirm(`هل أنت متأكد من حذف مناسبة "${event.title}" نهائياً؟\n\nسيتم حذف:\n- جميع الصور\n- جميع المباركات\n- جميع بيانات المشاركين\n- المناسبة كاملة`);
    if (!firstConfirm) return;
    const secondConfirm = window.confirm("تأكيد أخير: هذا الإجراء لا يمكن التراجع عنه!\n\nاضغط موافق للمتابعة أو إلغاء للتوقف.");
    if (!secondConfirm) return;
    try {
      console.log("بدء عملية حذف المناسبة:", event.token);

      // Delete all photos from storage first
      console.log("حذف الصور من التخزين...");
      try {
        const {
          data: files
        } = await supabase.storage.from("event-media").list(`events/${event.token}`, {
          limit: 1000
        });
        if (files && files.length > 0) {
          const filePaths = files.map(file => `events/${event.token}/${file.name}`);
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
      if (event.cover_url) {
        try {
          const coverFileName = event.cover_url.split('/').pop();
          if (coverFileName && coverFileName.includes(event.token)) {
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
      } = await supabase.from("blessings").delete().eq("event_token", event.token);
      if (blessingsError) console.error("خطأ في حذف المباركات:", blessingsError);

      // Delete participants
      console.log("حذف المشاركين...");
      const {
        error: participantsError
      } = await supabase.from("participants").delete().eq("event_token", event.token);
      if (participantsError) console.error("خطأ في حذف المشاركين:", participantsError);

      // Delete the event itself
      console.log("حذف المناسبة...");
      const {
        error: eventError
      } = await supabase.from("events").delete().eq("token", event.token);
      if (eventError) {
        console.error("خطأ في حذف المناسبة:", eventError);
        throw eventError;
      }
      console.log("تم حذف المناسبة بنجاح");
      toast({
        title: "تم حذف المناسبة نهائياً بنجاح"
      });

      // Call the callback to refresh the events list
      if (onEventDeleted) {
        onEventDeleted();
      }
    } catch (error) {
      console.error("خطأ عام في حذف المناسبة:", error);
      toast({
        title: "فشل في حذف المناسبة",
        description: "حدث خطأ أثناء الحذف. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };
  return <div className="border border-border rounded-xl overflow-hidden hover:shadow-elevated transition-shadow">
      {isPast ? <div className="cursor-pointer" onClick={() => setActionDialog(true)}>
          <div className="aspect-video bg-muted overflow-hidden">
            <img src={event.cover_url || heroImage} alt={`غلاف ${event.title}`} className="w-full h-full object-cover" />
          </div>
          <div className="p-3">
            <div className="font-nastaliq text-xl">{event.title}</div>
            
          </div>
        </div> : <Link to={linkTo}>
          <div className="aspect-video bg-muted overflow-hidden">
            <img src={event.cover_url || heroImage} alt={`غلاف ${event.title}`} className="w-full h-full object-cover" />
          </div>
          <div className="p-3">
            <div className="font-nastaliq text-xl">{event.title}</div>
            
          </div>
        </Link>}

      {/* Quick Actions - visible for current events; past events show only more menu */}
      <div className="p-3 pt-0 border-t">
        <div className="flex items-center justify-between min-h-10">
          <div className={`flex flex-wrap items-center gap-3 ${isPast ? 'invisible' : ''}`}>
            <Link to={`/album/${event.token}`} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors" title="زيارة الألبوم">
              <Image className="h-4 w-4" />
              <span>الألبوم</span>
            </Link>
            <Link to={`/event/${event.token}/camera`} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors" title="فتح الكاميرا">
              <Camera className="h-4 w-4" />
              <span>الكاميرا</span>
            </Link>
            <button onClick={() => setInviteDialogOpen(true)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors" title="مشاركة الرابط">
              <Share2 className="h-4 w-4" />
              <span>مشاركة</span>
            </button>
            {isOwner && <Link to={`/manage/${event.token}`} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors" title="إعدادات">
                <Settings className="h-4 w-4" />
                <span>إعدادات</span>
              </Link>}
          </div>

          {/* Right side: more menu only for past events */}
          {isPast && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-full border px-2 py-1" title="المزيد">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52 z-50">
                {isOwner && <DropdownMenuItem asChild>
                    <Link to={`/manage/${event.token}`}>إعدادات</Link>
                  </DropdownMenuItem>}
                <div className="px-2 py-1.5 text-xs text-muted-foreground">النشر</div>
                <DropdownMenuItem onClick={() => setQrOpen(true)} className="cursor-pointer">
                  <QrCode className="h-4 w-4" />
                  عرض الباركود
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadQrSvg} className="cursor-pointer">
                  <Download className="h-4 w-4" />
                  تنزيل SVG (كبير ومتمركز)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
                  <Share2 className="h-4 w-4" />
                  نسخ رابط المشاركة
                </DropdownMenuItem>
                {isOwner && <>
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">إدارة الألبوم</div>
                    <DropdownMenuItem asChild>
                      <Link to={`/manage/${event.token}`}>إدارة الخصوصية</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadAlbum} className="cursor-pointer" disabled={downloading}>
                      <Download className="h-4 w-4" />
                      {downloading ? "جاري التنزيل..." : "تنزيل الألبوم الكامل"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({
                title: "إلغاء المشاركة",
                description: "ميزة قيد التطوير"
              })} className="cursor-pointer">
                      إلغاء المشاركة
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/manage/${event.token}`}>وصول الضيوف</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={deleteEvent} className="cursor-pointer text-destructive">
                      حذف الألبوم
                    </DropdownMenuItem>
                  </>}
              </DropdownMenuContent>
            </DropdownMenu>}

        </div>
      </div>

      {/* Hidden QR for download purposes - Ultra high resolution */}
      <div className="sr-only">
        <QRCode id={svgId} value={shareUrl} size={1024} level="H" />
      </div>

      {/* Dialog for QR preview */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-[380px] z-50">
          <DialogHeader>
            <DialogTitle>باركود المناسبة</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <QRCode value={shareUrl} size={240} level="H" />
            <div className="flex gap-2 mt-4">
              <button onClick={downloadQrSvg} className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-sm hover:bg-accent">
                <Download className="h-4 w-4" />
                SVG
              </button>
              <button onClick={copyLink} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm hover:bg-accent">
                <Share2 className="h-4 w-4" />
                نسخ رابط
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="relative">
            <button
              onClick={() => setInviteDialogOpen(false)}
              className="absolute left-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">إغلاق</span>
            </button>
            <DialogTitle className="flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" />
              دعوة المناسبة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">{event.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isPast ? "باركود الألبوم" : "باركود المناسبة"}
              </p>
              <div className="flex justify-center mb-4">
                <QRCode 
                  value={isPast ? albumUrl : shareUrl} 
                  size={200} 
                  level="H" 
                />
              </div>
              <div className="text-xs text-muted-foreground font-mono break-all mb-4 p-2 bg-muted rounded">
                {isPast ? albumUrl : shareUrl}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const url = isPast ? albumUrl : shareUrl;
                  navigator.clipboard.writeText(url);
                  toast({
                    title: "تم نسخ الرابط",
                    description: "يمكنك الآن مشاركته"
                  });
                }}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                نسخ الرابط
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: event.title,
                      url: isPast ? albumUrl : shareUrl
                    });
                  } else {
                    const url = isPast ? albumUrl : shareUrl;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "تم نسخ الرابط",
                      description: "ميزة Web Share غير مدعومة"
                    });
                  }
                }}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                مشاركة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Dialog for Past Events */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {event.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">اختر الإجراء المطلوب:</p>
            <div className="grid gap-2">
              <Button asChild className="w-full">
                <Link to={`/album/${event.token}`}>
                  <Image className="h-4 w-4 mr-2" />
                  زيارة الألبوم
                </Link>
              </Button>
              {isOwner && <Button asChild variant="outline" className="w-full">
                  <Link to={`/manage/${event.token}`}>
                    <Settings className="h-4 w-4 mr-2" />
                    الإعدادات
                  </Link>
                </Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}