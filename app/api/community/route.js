import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === '1';

  const [{ data: trainers }, { data: promos }, { data: allMembers }] = await Promise.all([
    supabase
      .from('members')
      .select('id, name, belt, stripes, sessions, avatar_url, joined_at')
      .not('status', 'in', '("inactive","walk_in")')
      .order('sessions', { ascending: false, nullsFirst: false })
      .limit(all ? 500 : 10),
    supabase
      .from('promotions')
      .select('*')
      .order('promoted_at', { ascending: false })
      .limit(8),
    all
      ? supabase
          .from('members')
          .select('id, name, belt, stripes, sessions, avatar_url, joined_at, status')
          .not('status', 'in', '("inactive","walk_in")')
          .order('sessions', { ascending: false, nullsFirst: false })
      : Promise.resolve({ data: null }),
  ]);

  return Response.json(
    {
      trainers: (trainers || []).map(t => ({ ...t, sessions: t.sessions || 0 })),
      promos: promos || [],
      allMembers: allMembers ? allMembers.map(t => ({ ...t, sessions: t.sessions || 0 })) : null,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
