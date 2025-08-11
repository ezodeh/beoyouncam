import React, { useRef, useState, useEffect } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Play, Image } from 'lucide-react';

interface VideoThumbnailSelectorProps {
  videoUrl: string;
  onThumbnailSelect: (thumbnailBlob: Blob) => void;
  onCancel: () => void;
}

export function VideoThumbnailSelector({ videoUrl, onThumbnailSelect, onCancel }: VideoThumbnailSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const generateThumbnails = async () => {
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      const duration = video.duration;
      setVideoDuration(duration);
      
      const thumbnailCount = Math.min(6, Math.max(3, Math.floor(duration)));
      const interval = duration / thumbnailCount;
      const newThumbnails: string[] = [];

      for (let i = 0; i < thumbnailCount; i++) {
        const time = i * interval;
        video.currentTime = time;
        
        await new Promise((resolve) => {
          video.onseeked = resolve;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = 120;
        canvas.height = 90;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        newThumbnails.push(canvas.toDataURL('image/jpeg', 0.8));
      }

      setThumbnails(newThumbnails);
      setSelectedTime(0);
    };

    generateThumbnails();
  }, [videoUrl]);

  const handleThumbnailSelect = async (index: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const time = (videoDuration / thumbnails.length) * index;
    setSelectedTime(time);
    
    video.currentTime = time;
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create high-quality thumbnail
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        onThumbnailSelect(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">اختر غلاف للفيديو</h3>
        <p className="text-sm text-muted-foreground">
          اختر اللحظة التي تريدها كغلاف للفيديو
        </p>
      </div>

      {/* Video element - hidden */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="hidden"
        preload="metadata"
        muted
      />
      
      {/* Canvas for high-quality capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 gap-2">
        {thumbnails.map((thumbnail, index) => (
          <Card
            key={index}
            className={`relative cursor-pointer border-2 transition-colors ${
              selectedTime === (videoDuration / thumbnails.length) * index
                ? 'border-primary'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleThumbnailSelect(index)}
          >
            <div className="aspect-video relative overflow-hidden rounded">
              <img
                src={thumbnail}
                alt={`غلاف ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 rounded-full p-1">
                  <Play className="h-4 w-4 text-white" fill="white" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button onClick={() => handleThumbnailSelect(thumbnails.findIndex((_, i) => selectedTime === (videoDuration / thumbnails.length) * i))}>
          <Image className="h-4 w-4 ml-2" />
          استخدام هذا الغلاف
        </Button>
      </div>
    </div>
  );
}