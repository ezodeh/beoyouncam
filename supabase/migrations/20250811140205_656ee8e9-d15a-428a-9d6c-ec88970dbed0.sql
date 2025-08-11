-- إنشاء سياسات RLS للحذف من تخزين الأحداث
-- سياسة تسمح للمستخدمين بحذف ملفاتهم الخاصة فقط

-- حذف السياسات القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Allow event owners to delete their event media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete event media they own" ON storage.objects;

-- سياسة للسماح لمنشئي الأحداث بحذف جميع ملفات أحداثهم
CREATE POLICY "Event owners can delete all media from their events"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'event-media' 
  AND auth.uid() IN (
    SELECT owner_id 
    FROM public.events 
    WHERE token = (storage.foldername(name))[2]  -- events/TOKEN/filename
  )
);

-- سياسة للسماح للمستخدمين بحذف ملفاتهم الشخصية
CREATE POLICY "Users can delete their own uploaded media"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'event-media' 
  AND auth.uid()::text = (storage.foldername(name))[3]  -- events/TOKEN/USER_ID/filename
);

-- التأكد من تفعيل RLS على storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;