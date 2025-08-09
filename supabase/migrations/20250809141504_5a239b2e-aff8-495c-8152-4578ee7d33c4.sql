-- إضافة سياسة جديدة للسماح للمستخدمين برؤية مشاركاتهم حتى لو انضموا بدون تسجيل
-- السياسة الحالية تتطلب user_id = auth.uid() مما يمنع رؤية المشاركات للضيوف

-- حذف السياسة القديمة التي تقيد العرض
DROP POLICY IF EXISTS "Users can view their own participant rows" ON public.participants;

-- إضافة سياسة جديدة أكثر مرونة
CREATE POLICY "Users can view participant records"
ON public.participants
FOR SELECT
USING (
  -- إما أن يكون المستخدم مسجل الدخول ومطابق للـ user_id
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- أو يمكن للجميع رؤية المشاركات (للإحصائيات العامة)
  true
);

-- إضافة سياسة للسماح للمستخدمين بتحديث مشاركاتهم
CREATE POLICY "Users can update their own participant records"
ON public.participants
FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());