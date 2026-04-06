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

  // Insert session
  const { data, error } = await supabase
    .from('sessions')
    .insert({ member_id: memberId, session_date: sessionDate, note: note || null })
    .select()
    .single();

  if (error) {
    // Handle duplicate date gracefully
    if (error.code === '23505') {
      return Response.json({ error: 'Already logged for that date.' }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Increment session count on the member row
  const { data: member } = await supabase
    .from('members')
    .select('sessions')
    .eq('id', memberId)
    .single();

  await supabase
    .from('members')
    .update({ sessions: (member?.sessions || 0) + 1 })
    .eq('id', memberId);

  return Response.json({ session: data });
}
