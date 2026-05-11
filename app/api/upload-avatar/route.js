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

  const ext = file.name.split('.').pop();
  const path = `${memberId}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error('Avatar upload error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

  // Save avatar_url to member record
  await supabase.from('members').update({ avatar_url: publicUrl }).eq('id', memberId);

  return Response.json({ publicUrl });
}
