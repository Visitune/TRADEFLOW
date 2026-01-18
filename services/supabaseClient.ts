import { createClient } from '@supabase/supabase-js';

// Configuration placeholders
// In a real deployment, these would come from import.meta.env or process.env
const SUPABASE_URL = ''; // e.g. "https://xyz.supabase.co"
const SUPABASE_ANON_KEY = ''; // e.g. "eyJhbGciOiJIUzI1NiIsInR..."

// Initialize the client only if keys are present to avoid runtime errors during demo/mock phase
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Helper to check connection status
export const isSupabaseConfigured = () => {
  return !!supabase;
};