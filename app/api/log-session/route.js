import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const { memberId, sessionDate, note } = await request.json();
  if (!memberId || !sessionDate) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Insert the session row
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

  // Atomically increment the session count using the database function
  await supabase.rpc('increment_session_count', { member_uuid: memberId });

  return Response.json({ session: data });
}

export async function DELETE(request) {
  const { sessionId, memberId } = await request.json();
  if (!sessionId || !memberId) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await supabase.from('sessions').delete().eq('id', sessionId);

  // Decrement session count
  const { data: member } = await supabase
    .from('members')
    .select('sessions')
    .eq('id', memberId)
    .single();

  await supabase
    .from('members')
    .update({ sessions: Math.max(0, (member?.sessions || 1) - 1) })
    .eq('id', memberId);

  return Response.json({ success: true });
}
