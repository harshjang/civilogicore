import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const expectedSupabaseUrl = "https://wzynwgpigtekkdmkuars.supabase.co";
const expectedSupabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eW53Z3BpZ3Rla2tkbWt1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjY3NzYsImV4cCI6MjA4ODU0Mjc3Nn0.pJOzZT7fIbHIci_vYgpZXUlqg7JM_9WvEktzWjtH7eg";

const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envSupabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const envMatchesProject = envSupabaseUrl?.includes("wzynwgpigtekkdmkuars") && envSupabaseKey?.includes("wzynwgpigtekkdmkuars");

const supabaseUrl = envMatchesProject ? envSupabaseUrl : expectedSupabaseUrl;
const supabaseKey = envMatchesProject ? envSupabaseKey : expectedSupabaseKey;

export { supabaseUrl };
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
