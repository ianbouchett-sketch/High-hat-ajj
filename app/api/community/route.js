import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const [{ data: trainers }, { data: promos }] = await Promise.all([
    supabase
      .from('members')
      .select('id, name, belt, stripes, sessions')
      .in('status', ['active', 'pending'])
      .order('sessions', { ascending: false })
      .limit(10),
    supabase
      .from('promotions')
      .select('*')
      .order('promoted_at', { ascending: false })
      .limit(8),
  ]);

  return Response.json({ trainers: trainers || [], promos: promos || [] });
}
