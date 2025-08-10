import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Crop as CropIcon, RotateCw, Download, Upload } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditorProps {
  src: string;
  onImageChange: (newImageSrc: string) => void;
  children: React.ReactNode;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function ImageEditor({ src, onImageChange, children }: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [open, setOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);

    ctx.scale(scale, scale);
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;

    ctx.save();

    // Apply rotation
    if (rotation !== 0) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    ctx.drawImage(
      image,
      cropX,
      cropY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.restore();

    // Convert canvas to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        onImageChange(url);
        setOpen(false);
      }
    }, 'image/jpeg', 0.9);
  }, [completedCrop, scale, rotation, onImageChange]);

  const resetCrop = () => {
    if (imgRef.current && aspect) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5" />
            محرر الصور
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>نسبة العرض إلى الارتفاع</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={aspect === 16/9 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAspect(16/9)}
                    >
                      16:9
                    </Button>
                    <Button
                      variant={aspect === 4/3 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAspect(4/3)}
                    >
                      4:3
                    </Button>
                    <Button
                      variant={aspect === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAspect(1)}
                    >
                      1:1
                    </Button>
                    <Button
                      variant={aspect === undefined ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAspect(undefined)}
                    >
                      حر
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>التكبير: {scale.toFixed(1)}x</Label>
                  <Slider
                    value={[scale]}
                    onValueChange={(value) => setScale(value[0])}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>الدوران: {rotation}°</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation(rotation - 90)}
                    >
                      <RotateCw className="h-4 w-4 scale-x-[-1]" />
                    </Button>
                    <Slider
                      value={[rotation]}
                      onValueChange={(value) => setRotation(value[0])}
                      min={-180}
                      max={180}
                      step={1}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation(rotation + 90)}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <Button onClick={resetCrop} variant="outline" className="w-full">
                  إعادة تعيين الاقتصاص
                </Button>
                <Button 
                  onClick={generateCroppedImage} 
                  className="w-full"
                  disabled={!completedCrop}
                >
                  <Download className="h-4 w-4 ml-2" />
                  تطبيق التغييرات
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Image Crop Area */}
          <div className="flex justify-center">
            <div className="max-w-full">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  alt="اقتصاص"
                  src={src}
                  style={{ 
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    maxWidth: '100%',
                    maxHeight: '60vh'
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
          </div>

          {/* Hidden canvas for image processing */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}