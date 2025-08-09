-- إنشاء جدول لربط الوسائط بالمشاركين
CREATE TABLE public.media_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_token TEXT NOT NULL,
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'image' or 'video'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.media_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view media submissions" 
ON public.media_submissions 
FOR SELECT 
USING (true);

CREATE POLICY "Participants can create their own media submissions" 
ON public.media_submissions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.participants p 
    WHERE p.id = participant_id 
    AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  )
);

-- Create an index for performance
CREATE INDEX idx_media_submissions_event_token ON public.media_submissions(event_token);
CREATE INDEX idx_media_submissions_participant_id ON public.media_submissions(participant_id);