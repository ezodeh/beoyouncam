-- Create storage bucket for event customization images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-customization', 'event-customization', true);

-- Create RLS policies for event customization bucket
CREATE POLICY "Anyone can view customization images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-customization');

CREATE POLICY "Event owners can upload customization images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-customization');

CREATE POLICY "Event owners can update customization images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'event-customization');

CREATE POLICY "Event owners can delete customization images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'event-customization');