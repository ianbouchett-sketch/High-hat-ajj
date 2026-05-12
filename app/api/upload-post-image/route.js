import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  const supabase = getSupabase();
  const formData = await request.formData();
  const file = formData.get('file');
  const memberId = formData.get('memberId');

  if (!file || !memberId) {
    return Response.json({ error: 'Missing file or memberId.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${memberId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from('Posts')
    .upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Post image upload error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from('Posts').getPublicUrl(path);
  return Response.json({ publicUrl });
}
