import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('id');
  if (!memberId) return Response.json({ error: 'Missing id.' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const [{ data: member }, { data: lastPromo }] = await Promise.all([
    supabase
      .from('members')
      .select('id, name, belt, stripes, sessions, avatar_url, joined_at, status')
      .eq('id', memberId)
      .single(),
    supabase
      .from('promotions')
      .select('new_belt, new_stripes, promoted_at')
      .eq('member_id', memberId)
      .order('promoted_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (!member) return Response.json({ error: 'Member not found.' }, { status: 404 });

  return Response.json({
    member: {
      id: member.id,
      name: member.name,
      belt: member.belt,
      stripes: member.stripes,
      sessions: member.sessions || 0,
      avatar_url: member.avatar_url,
      joined_at: member.joined_at,
    },
    lastPromo: lastPromo || null,
  });
}
