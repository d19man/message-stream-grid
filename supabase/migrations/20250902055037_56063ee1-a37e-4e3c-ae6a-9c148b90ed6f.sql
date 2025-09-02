-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('template-audio', 'template-audio', true);

-- Create storage policies for template audio uploads
CREATE POLICY "Users can view template audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'template-audio');

CREATE POLICY "Users can upload template audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'template-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own template audio files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'template-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own template audio files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'template-audio' AND auth.uid()::text = (storage.foldername(name))[1]);