
-- Survey points table
CREATE TABLE public.survey_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  point_no TEXT NOT NULL DEFAULT '',
  easting DOUBLE PRECISION NOT NULL DEFAULT 0,
  northing DOUBLE PRECISION NOT NULL DEFAULT 0,
  elevation DOUBLE PRECISION NOT NULL DEFAULT 0,
  code TEXT NOT NULL DEFAULT '',
  layer TEXT NOT NULL DEFAULT 'Boundary',
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own survey points" ON public.survey_points
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own survey points" ON public.survey_points
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own survey points" ON public.survey_points
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own survey points" ON public.survey_points
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Documents/folders table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'file',
  file_type TEXT,
  file_size BIGINT DEFAULT 0,
  storage_path TEXT,
  parent_folder_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Estimations table
CREATE TABLE public.estimations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calc_type TEXT NOT NULL DEFAULT 'earthwork',
  length DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION NOT NULL DEFAULT 0,
  depth DOUBLE PRECISION NOT NULL DEFAULT 0,
  volume DOUBLE PRECISION NOT NULL DEFAULT 0,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.estimations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own estimations" ON public.estimations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own estimations" ON public.estimations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own estimations" ON public.estimations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for user documents
INSERT INTO storage.buckets (id, name, public) VALUES ('user-documents', 'user-documents', false);

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Triggers for updated_at
CREATE TRIGGER update_survey_points_updated_at BEFORE UPDATE ON public.survey_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
