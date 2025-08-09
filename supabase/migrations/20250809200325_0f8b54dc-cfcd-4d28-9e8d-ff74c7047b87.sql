-- إضافة عمود لتفعيل/إلغاء تفعيل الفيديو للمناسبة
ALTER TABLE public.events 
ADD COLUMN enable_video BOOLEAN NOT NULL DEFAULT true;