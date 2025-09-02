-- Create storage bucket for template images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('template-images', 'template-images', true);

-- Create storage policies for template image uploads
CREATE POLICY "Users can view template image files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'template-images');

CREATE POLICY "Users can upload template image files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'template-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own template image files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'template-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own template image files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'template-images' AND auth.uid()::text = (storage.foldername(name))[1]);