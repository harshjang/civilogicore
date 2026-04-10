
DROP POLICY "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents"
ON public.documents
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
