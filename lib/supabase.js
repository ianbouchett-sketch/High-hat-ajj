import { createClient } from '@supabase/supabase-js';

// Browser-safe client — uses anon key, respects Row Level Security
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Server-only client — uses service role key, bypasses RLS
// Only import this in server components or API routes, never in browser code
export function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
