import React, { useRef, useEffect, useState } from 'react';
import { Play } from 'lucide-react';

interface VideoThumbnailProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  showPlayIcon?: boolean;
}

export function VideoThumbnail({ 
  src, 
  alt = "فيديو", 
  className = "", 
  onClick,
  showPlayIcon = true 
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const generateThumbnail = () => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setThumbnailUrl(dataUrl);
      } catch (error) {
        console.warn('فشل في إنتاج thumbnail للفيديو:', error);
      }
    };

    const handleLoadedData = () => {
      // أخذ thumbnail من البداية
      video.currentTime = 0.1;
    };

    const handleSeeked = () => {
      generateThumbnail();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`} onClick={onClick}>
      {/* Video element - hidden but used for thumbnail generation */}
      <video
        ref={videoRef}
        src={src}
        className="hidden"
        preload="metadata"
        muted
      />
      
      {/* Canvas for thumbnail generation - hidden */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Display thumbnail or fallback to video */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          src={src}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
      )}
      
      {/* Play icon overlay */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-2">
            <Play className="h-4 w-4 text-white" fill="white" />
          </div>
        </div>
      )}
    </div>
  );
}