import { useState } from "react";
import { Link } from "react-router-dom";
import { Image, Camera, Share2, Settings, MoreVertical, QrCode, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";


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

export default function EventCard({ event, linkTo, subtitle, isOwner, isPast, onEventDeleted }: EventCardProps) {
  const { toast } = useToast();
  const [qrOpen, setQrOpen] = useState(false);
  const svgId = `qr-svg-${event.token}`;
  const shareUrl = `${window.location.origin}/event/${event.token}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "تم نسخ الرابط", description: "يمكنك الآن مشاركته" });
    } catch {
      toast({ title: "تعذّر نسخ الرابط", description: shareUrl, variant: "destructive" });
    }
  };

  const downloadQrSvg = () => {
    const svg = document.querySelector<SVGSVGElement>(`#${svgId}`);
    if (!svg) {
      toast({ title: "تعذّر العثور على الباركود", variant: "destructive" });
      return;
    }
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `event-${event.token}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "تم تنزيل الباركود بصيغة SVG عالية الجودة" });
  };

  const downloadQrPng = () => {
    const svg = document.querySelector<SVGSVGElement>(`#${svgId}`);
    if (!svg) {
      toast({ title: "تعذّر العثور على الباركود", variant: "destructive" });
      return;
    }

    // Create a high-resolution canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high resolution (4x for crisp quality)
    const scale = 4;
    const size = 512; // Base size
    canvas.width = size * scale;
    canvas.height = size * scale;
    
    // Scale the context for high DPI
    ctx.scale(scale, scale);
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const img = document.createElement("img");
    img.onload = () => {
      // Fill white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      
      // Draw the QR code
      ctx.drawImage(img, 0, 0, size, size);
      
      // Convert to PNG and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `event-${event.token}-qr-hd.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(svgUrl);
        toast({ title: "تم تنزيل الباركود بجودة عالية PNG" });
      }, "image/png", 1.0);
    };
    
    img.src = svgUrl;
  };

  const webShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "تم نسخ الرابط", description: "ميزة Web Share غير مدعومة" });
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
        const { data: files } = await supabase.storage
          .from("event-media")
          .list(`events/${event.token}`, { limit: 1000 });
        
        if (files && files.length > 0) {
          const filePaths = files.map(file => `events/${event.token}/${file.name}`);
          const { error: storageError } = await supabase.storage
            .from("event-media")
            .remove(filePaths);
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
      const { error: blessingsError } = await supabase
        .from("blessings")
        .delete()
        .eq("event_token", event.token);
      if (blessingsError) console.error("خطأ في حذف المباركات:", blessingsError);
      
      // Delete participants
      console.log("حذف المشاركين...");
      const { error: participantsError } = await supabase
        .from("participants")
        .delete()
        .eq("event_token", event.token);
      if (participantsError) console.error("خطأ في حذف المشاركين:", participantsError);
      
      // Delete the event itself
      console.log("حذف المناسبة...");
      const { error: eventError } = await supabase
        .from("events")
        .delete()
        .eq("token", event.token);
      
      if (eventError) {
        console.error("خطأ في حذف المناسبة:", eventError);
        throw eventError;
      }
      
      console.log("تم حذف المناسبة بنجاح");
      toast({ title: "تم حذف المناسبة نهائياً بنجاح" });
      
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

  return (
    <div className="border border-border rounded-xl overflow-hidden hover:shadow-elevated transition-shadow">
      <Link to={linkTo}>
        <div className="aspect-video bg-muted overflow-hidden">
          {event.cover_url ? (
            <img src={event.cover_url} alt={`غلاف ${event.title}`} className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="p-3">
          <div className="font-nastaliq text-xl">{event.title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </Link>

      {/* Quick Actions - visible for current events; past events show only more menu */}
      <div className="p-3 pt-0 border-t">
        <div className="flex items-center justify-between min-h-10">
          <div className={`flex flex-wrap items-center gap-3 ${isPast ? 'invisible' : ''}`}>
            <Link
              to={`/album/${event.token}`}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              title="زيارة الألبوم"
            >
              <Image className="h-4 w-4" />
              <span>الألبوم</span>
            </Link>
            <Link
              to={`/event/${event.token}/camera`}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              title="فتح الكاميرا"
            >
              <Camera className="h-4 w-4" />
              <span>الكاميرا</span>
            </Link>
            <button
              onClick={webShare}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              title="مشاركة الرابط"
            >
              <Share2 className="h-4 w-4" />
              <span>مشاركة</span>
            </button>
            {isOwner && (
              <Link
                to={`/manage/${event.token}`}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                title="إعدادات"
              >
                <Settings className="h-4 w-4" />
                <span>إعدادات</span>
              </Link>
            )}
          </div>

          {/* Right side: more menu only for past events */}
          {isPast && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-full border px-2 py-1" title="المزيد">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52 z-50">
                {isOwner && (
                  <DropdownMenuItem asChild>
                    <Link to={`/manage/${event.token}`}>إعدادات</Link>
                  </DropdownMenuItem>
                )}
                <div className="px-2 py-1.5 text-xs text-muted-foreground">النشر</div>
                <DropdownMenuItem onClick={() => setQrOpen(true)} className="cursor-pointer">
                  <QrCode className="h-4 w-4" />
                  عرض الباركود
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadQrSvg} className="cursor-pointer">
                  <Download className="h-4 w-4" />
                  تنزيل SVG (فائق الجودة)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadQrPng} className="cursor-pointer">
                  <Download className="h-4 w-4" />
                  تنزيل PNG (عالي الدقة)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
                  <Share2 className="h-4 w-4" />
                  نسخ رابط المشاركة
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">إدارة الألبوم</div>
                    <DropdownMenuItem asChild>
                      <Link to={`/manage/${event.token}`}>إدارة الخصوصية</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "تنزيل الألبوم", description: "ميزة قيد التطوير" })} className="cursor-pointer">
                      تنزيل الألبوم
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "إلغاء المشاركة", description: "ميزة قيد التطوير" })} className="cursor-pointer">
                      إلغاء المشاركة
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/manage/${event.token}`}>وصول الضيوف</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={deleteEvent} className="cursor-pointer text-destructive">
                      حذف الألبوم
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

        </div>
      </div>

      {/* Hidden QR for download purposes - High resolution */}
      <div className="sr-only">
        <QRCode id={svgId} value={shareUrl} size={512} level="H" />
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
                SVG (فائق)
              </button>
              <button onClick={downloadQrPng} className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-sm hover:bg-accent">
                <Download className="h-4 w-4" />
                PNG (عالي)
              </button>
              <button onClick={copyLink} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm hover:bg-accent">
                <Share2 className="h-4 w-4" />
                نسخ رابط
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
