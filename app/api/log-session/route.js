import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  const { memberId, sessionDate, note } = await request.json();
  if (!memberId || !sessionDate) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('sessions')
    .insert({ member_id: memberId, session_date: sessionDate, note: note || null })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: 'Already logged for that date.' }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Recalculate session count from actual records -- always accurate
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId);

  await supabase
    .from('members')
    .update({ sessions: count || 0 })
    .eq('id', memberId);

  return Response.json({ session: data });
}

export async function DELETE(request) {
  const { sessionId, memberId } = await request.json();
  if (!sessionId || !memberId) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getSupabase();

  await supabase.from('sessions').delete().eq('id', sessionId);

  // Recalculate from actual records
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId);

  await supabase
    .from('members')
    .update({ sessions: count || 0 })
    .eq('id', memberId);

  return Response.json({ success: true });
}
