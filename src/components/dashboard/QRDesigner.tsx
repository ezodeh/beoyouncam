import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect } from "fabric";
import { toast } from "sonner";

interface QRDesignerProps {
  width?: number;
  height?: number;
}

export default function QRDesigner({ width = 320, height = 200 }: QRDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "rectangle" | "circle">("select");

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
    });

    // Initialize free drawing brush
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = 2;

    setFabricCanvas(canvas);
    toast("المحرّر جاهز! ابدأ بالرسم");

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";

    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 2;
    }
  }, [activeTool, activeColor, fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (tool === "rectangle") {
      const rect = new Rect({ left: 40, top: 40, fill: activeColor, width: 80, height: 60 });
      fabricCanvas?.add(rect);
    } else if (tool === "circle") {
      const circle = new Circle({ left: 60, top: 60, fill: activeColor, radius: 30 });
      fabricCanvas?.add(circle);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast("تم تنظيف اللوحة");
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    const dataUrl = fabricCanvas.toDataURL({ multiplier: 2, format: "png" });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qr-design.png";
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => handleToolClick("select")} className="rounded-full border px-3 py-1 text-xs">تحديد</button>
        <button onClick={() => handleToolClick("draw")} className="rounded-full border px-3 py-1 text-xs">رسم</button>
        <button onClick={() => handleToolClick("rectangle")} className="rounded-full border px-3 py-1 text-xs">مستطيل</button>
        <button onClick={() => handleToolClick("circle")} className="rounded-full border px-3 py-1 text-xs">دائرة</button>
        <input type="color" value={activeColor} onChange={(e) => setActiveColor(e.target.value)} className="h-7 w-10 border rounded" />
        <button onClick={handleClear} className="rounded-full border px-3 py-1 text-xs">تنظيف</button>
        <button onClick={handleDownload} className="rounded-full border px-3 py-1 text-xs">تنزيل التصميم</button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
    </div>
  );
}
