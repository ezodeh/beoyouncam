-- إصلاح بيانات المناسبة 091wycv8 لتعكس الإعدادات الصحيحة
UPDATE events 
SET expected_guests = 5 
WHERE token = '091wycv8';