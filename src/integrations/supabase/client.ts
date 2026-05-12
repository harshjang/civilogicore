import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabaseUrl, supabase } from '@/lib/supabase';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export { supabaseUrl, supabase };
export type { Database };
