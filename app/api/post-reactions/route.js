import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  const supabase = getSupabase();
  const { post_id, member_id, promotion_id } = await request.json();

  if (!post_id || !member_id) {
    return Response.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  // Check if reaction exists
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', post_id)
    .eq('member_id', member_id)
    .single();

  if (existing) {
    // Unlike
    await supabase.from('post_reactions').delete().eq('id', existing.id);

    // If this post is linked to a promotion, sync the unlike back to promotion_likes
    if (promotion_id) {
      await supabase.from('promotion_likes').delete()
        .eq('promotion_id', promotion_id)
        .eq('member_id', member_id);
    }

    return Response.json({ liked: false });
  } else {
    // Like
    await supabase.from('post_reactions').insert({ post_id, member_id });

    // Sync to promotion_likes for continuity with existing promotions view
    if (promotion_id) {
      await supabase.from('promotion_likes').upsert(
        { promotion_id, member_id },
        { onConflict: 'promotion_id,member_id' }
      );
    }

    return Response.json({ liked: true });
  }
}
