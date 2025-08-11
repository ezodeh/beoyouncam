-- إنشاء سياسة حذف للـ event-media bucket
-- السماح لمنشئي الأحداث بحذف ملفات أحداثهم

CREATE POLICY "Event owners can delete their event media"
ON storage.objects 
FOR DELETE 
TO public
USING (
  bucket_id = 'event-media' 
  AND auth.uid() IN (
    SELECT owner_id 
    FROM public.events 
    WHERE token = (string_to_array(name, '/'))[2]  -- events/TOKEN/filename
  )
);