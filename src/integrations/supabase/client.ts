// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// استخدام القيم من Lovable Cloud مباشرة
const SUPABASE_URL = "https://uunlxjcexsneekkbkysm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bmx4amNleHNuZWVra2JreXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDAzNDMsImV4cCI6MjA4NDkxNjM0M30.QfcW0iaQld9gqSty_cMdGNMLQ_LVGSk7V8t6awnT9R0";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
