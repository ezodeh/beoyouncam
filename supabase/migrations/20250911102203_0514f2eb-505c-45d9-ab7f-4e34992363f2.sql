-- حذف المشاركين المكررين والاحتفاظ بالأحدث فقط
DELETE FROM participants 
WHERE event_token = '276srg4q' 
AND user_id = '574f336f-24ae-4ee4-803e-a0fa3bb42246'
AND id NOT IN (
  SELECT id 
  FROM participants 
  WHERE event_token = '276srg4q' 
  AND user_id = '574f336f-24ae-4ee4-803e-a0fa3bb42246'
  ORDER BY created_at DESC 
  LIMIT 1
);