import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// General member update -- used by admin for belt, status, info, etc.
export async function PATCH(request) {
  const { id, ...updates } = await request.json();
  if (!id) return Response.json({ error: 'Missing member ID' }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ member: data });
}

// Delete a member
export async function DELETE(request) {
  const { id } = await request.json();
  if (!id) return Response.json({ error: 'Missing member ID' }, { status: 400 });

  const supabase = getSupabase();
  await supabase.from('sessions').delete().eq('member_id', id);
  await supabase.from('members').delete().eq('id', id);
  return Response.json({ success: true });
}
