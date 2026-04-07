import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(`Missing env vars: url=${!!url} key=${!!key}`);
  }
  return createClient(url, key);
}

export async function PATCH(request) {
  const { id, ...updates } = await request.json();
  if (!id) return Response.json({ error: 'Missing member ID' }, { status: 400 });

  let supabase;
  try {
    supabase = getSupabase();
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('PATCH /api/member error:', error);
    return Response.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return Response.json({ member: data });
}

export async function DELETE(request) {
  const { id } = await request.json();
  if (!id) return Response.json({ error: 'Missing member ID' }, { status: 400 });

  let supabase;
  try {
    supabase = getSupabase();
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  await supabase.from('sessions').delete().eq('member_id', id);
  await supabase.from('members').delete().eq('id', id);
  return Response.json({ success: true });
}
