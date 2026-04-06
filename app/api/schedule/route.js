import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Add a class
export async function POST(request) {
  const body = await request.json();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('schedule')
    .insert({ ...body, active: true })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ class: data });
}

// Update a class
export async function PATCH(request) {
  const { id, ...updates } = await request.json();
  const supabase = getSupabase();
  const { error } = await supabase.from('schedule').update(updates).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}

// Delete (soft) a class
export async function DELETE(request) {
  const { id } = await request.json();
  const supabase = getSupabase();
  const { error } = await supabase.from('schedule').update({ active: false }).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
