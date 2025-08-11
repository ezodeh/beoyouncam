import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Download, Copy, Image, X, Maximize } from "lucide-react";
import QRCode from "react-qr-code";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface QRCodesTabProps {
  token: string;
  eventData: any;
}

export function QRCodesTab({ token, eventData }: QRCodesTabProps) {
  const { toast } = useToast();
  const [enlargedQR, setEnlargedQR] = useState<{ url: string; title: string } | null>(null);
  const [fullscreenQR, setFullscreenQR] = useState(false);
  const eventUrl = `${window.location.origin}/event/${token}/welcome`;
  const albumUrl = `${window.location.origin}/album/${token}`;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `تم نسخ رابط ${type} بنجاح` });
    } catch (error) {
      toast({ title: "فشل في النسخ", variant: "destructive" });
    }
  };

  const downloadQR = (qrId: string, filename: string, size = 1024) => {
    const svg = document.querySelector<SVGSVGElement>(`#${qrId}`);
    if (!svg) return;
    
    const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute("width", size.toString());
    clonedSvg.setAttribute("height", size.toString());
    clonedSvg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", "white");
    clonedSvg.insertBefore(rect, clonedSvg.firstChild);
    
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(clonedSvg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadQRAsPNG = (qrId: string, filename: string, size = 2048) => {
    const svg = document.querySelector<SVGSVGElement>(`#${qrId}`);
    if (!svg) return;
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const scale = 4;
    canvas.width = size * scale;
    canvas.height = size * scale;
    ctx.scale(scale, scale);
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = document.createElement("img");
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(pngUrl);
        }
      }, "image/png", 1.0);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Event QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <QrCode className="h-5 w-5" />
              باركود المناسبة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div 
                className="bg-white p-4 rounded-lg inline-block border cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setEnlargedQR({ url: eventUrl, title: "باركود المناسبة" })}
              >
                <QRCode id="event-qr" value={eventUrl} size={150} level="H" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground text-right">
                يوجه الضيوف إلى صفحة الترحيب للانضمام للمناسبة
              </p>
              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono break-all text-right">
                {eventUrl}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(eventUrl, "المناسبة")}
              >
                <Copy className="h-4 w-4 ml-2" />
                نسخ الرابط
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => downloadQR("event-qr", `event-${token}-qr.svg`)}
              >
                <Download className="h-4 w-4 ml-2" />
                SVG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => downloadQRAsPNG("event-qr", `event-${token}-qr-hd.png`)}
              >
                <Image className="h-4 w-4 ml-2" />
                PNG عالي الجودة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Album QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Image className="h-5 w-5" />
              باركود الألبوم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div 
                className="bg-white p-4 rounded-lg inline-block border cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setEnlargedQR({ url: albumUrl, title: "باركود الألبوم" })}
              >
                <QRCode id="album-qr" value={albumUrl} size={150} level="H" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground text-right">
                يوجه مباشرة إلى عرض ألبوم الصور
              </p>
              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono break-all text-right">
                {albumUrl}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(albumUrl, "الألبوم")}
              >
                <Copy className="h-4 w-4 ml-2" />
                نسخ الرابط
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => downloadQR("album-qr", `album-${token}-qr.svg`)}
              >
                <Download className="h-4 w-4 ml-2" />
                SVG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => downloadQRAsPNG("album-qr", `album-${token}-qr-hd.png`)}
              >
                <Image className="h-4 w-4 ml-2" />
                PNG عالي الجودة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">كيفية الاستخدام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-right">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold">باركود المناسبة</h4>
                <p className="text-sm text-muted-foreground">
                  اطبع هذا الباركود أو اعرضه في مكان المناسبة. عندما يمسحه الضيوف، سيتم توجيههم إلى صفحة الترحيب حيث يمكنهم التسجيل والانضمام.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold">باركود الألبوم</h4>
                <p className="text-sm text-muted-foreground">
                  استخدم هذا الباركود لمشاركة ألبوم الصور مع الضيوف بعد انتهاء المناسبة. يمكنهم مسحه لعرض جميع الذكريات.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold">جودة الطباعة</h4>
                <p className="text-sm text-muted-foreground">
                  للحصول على أفضل جودة طباعة، استخدم ملف PNG عالي الجودة. ملف SVG مناسب للتصاميم الرقمية والتعديل.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enlarged QR Dialog */}
      <Dialog open={!!enlargedQR} onOpenChange={() => setEnlargedQR(null)}>
        <DialogContent className={`${fullscreenQR ? 'max-w-full h-screen' : 'max-w-md'} p-8`}>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEnlargedQR(null)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-lg font-semibold">
              {enlargedQR?.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreenQR(!fullscreenQR)}
              className="h-8 w-8 p-0"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg inline-block border shadow-sm">
              {enlargedQR && (
                <QRCode value={enlargedQR.url} size={fullscreenQR ? 400 : 280} level="H" />
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              اضغط على الباركود أو استخدم كاميرا الهاتف لمسحه
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}