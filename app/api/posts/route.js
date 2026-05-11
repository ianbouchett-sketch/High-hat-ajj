import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const hashtag = searchParams.get('hashtag');

  let query = supabase
    .from('posts')
    .select('*, post_reactions(member_id)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (hashtag) {
    query = query.ilike('content', `%#${hashtag}%`);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ posts: data || [] });
}

export async function POST(request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { member_id, member_name, content, image_url, post_type, promotion_id } = body;

  if (!member_id || (!content && !image_url)) {
    return Response.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ member_id, member_name, content, image_url, post_type: post_type || 'member', promotion_id: promotion_id || null })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ post: data });
}

export async function DELETE(request) {
  const supabase = getSupabase();
  const { post_id, member_id, is_admin } = await request.json();
  if (!post_id) return Response.json({ error: 'Missing post_id.' }, { status: 400 });

  // Verify ownership unless admin
  if (!is_admin) {
    const { data: post } = await supabase.from('posts').select('member_id').eq('id', post_id).single();
    if (!post || post.member_id !== member_id) {
      return Response.json({ error: 'Not authorized.' }, { status: 403 });
    }
  }

  const { error } = await supabase.from('posts').delete().eq('id', post_id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
