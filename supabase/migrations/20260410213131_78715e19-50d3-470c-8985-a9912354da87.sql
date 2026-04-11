
CREATE POLICY "Users can update own documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
