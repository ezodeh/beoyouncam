import { useState } from "react";
import { Link } from "react-router-dom";
import { Image, Camera, Share2, Settings, MoreVertical, QrCode, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { useToast } from "@/components/ui/use-toast";


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
}

export default function EventCard({ event, linkTo, subtitle, isOwner, isPast }: EventCardProps) {
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
      // Shouldn't happen since we render a hidden SVG below
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
    toast({ title: "تم تنزيل الباركود" });
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
                  عرض الباركود
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadQrSvg} className="cursor-pointer">
                  تنزيل الباركود (SVG)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
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
                    <DropdownMenuItem onClick={() => toast({ title: "حذف الألبوم", description: "يرجى التأكيد لاحقًا", variant: "destructive" })} className="cursor-pointer text-destructive">
                      حذف الألبوم
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

        </div>
      </div>

      {/* Hidden QR for download purposes */}
      <div className="sr-only">
        <QRCode id={svgId} value={shareUrl} size={192} />
      </div>

      {/* Dialog for QR preview */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-[380px] z-50">
          <DialogHeader>
            <DialogTitle>باركود المناسبة</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <QRCode id={svgId} value={shareUrl} size={240} />
            <div className="flex gap-2">
              <button onClick={downloadQrSvg} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm">
                <Download className="h-4 w-4" /> تنزيل
              </button>
              <button onClick={copyLink} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm">
                <Share2 className="h-4 w-4" /> نسخ الرابط
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
