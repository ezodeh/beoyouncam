-- إزالة شرط العمر 18+ لإنشاء الأحداث
DROP FUNCTION IF EXISTS public.ensure_event_creator_is_adult() CASCADE;