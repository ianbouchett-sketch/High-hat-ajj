import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const [{ data: trainers, error: tErr }, { data: promos, error: pErr }] = await Promise.all([
    supabase
      .from('members')
      .select('id, name, belt, stripes, sessions')
      .neq('status', 'inactive')
      .order('sessions', { ascending: false, nullsFirst: false })
      .limit(10),
    supabase
      .from('promotions')
      .select('*')
      .order('promoted_at', { ascending: false })
      .limit(8),
  ]);

  if (tErr) console.error('trainers error:', tErr);
  if (pErr) console.error('promos error:', pErr);

  // Normalize sessions to 0 if null
  const normalizedTrainers = (trainers || []).map(t => ({
    ...t,
    sessions: t.sessions || 0,
  }));

  return Response.json({ trainers: normalizedTrainers, promos: promos || [] });
}
