import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// GET /api/post-reactions?post_id=xxx&member_id=yyy
// Returns the list of people who OSS'd a post or promotion
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('post_id');
  const memberId = searchParams.get('member_id');

  if (!postId) return Response.json({ error: 'Missing post_id' }, { status: 400 });

  const supabase = getSupabase();

  // Promotion likes use promo_ prefix
  if (postId.startsWith('promo_')) {
    const promoId = postId.replace('promo_', '');
    const { data } = await supabase
      .from('promotion_likes')
      .select('member_id, members(name)')
      .eq('promotion_id', promoId)
      .order('created_at', { ascending: true });

    return Response.json({
      likers: (data || []).map(r => ({
        name: r.members?.name || 'Unknown',
        is_me: r.member_id === memberId,
      })),
    });
  }

  // Regular post reactions
  const { data } = await supabase
    .from('post_reactions')
    .select('member_id, members(name)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  return Response.json({
    likers: (data || []).map(r => ({
      name: r.members?.name || 'Unknown',
      is_me: r.member_id === memberId,
    })),
  });
}

// POST /api/post-reactions — toggle like on/off
export async function POST(request) {
  const supabase = getSupabase();
  const { post_id, member_id, promotion_id } = await request.json();

  if (!post_id || !member_id) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', post_id)
    .eq('member_id', member_id)
    .single();

  if (existing) {
    await supabase.from('post_reactions').delete().eq('id', existing.id);
    return Response.json({ action: 'unliked' });
  } else {
    await supabase.from('post_reactions').insert({
      post_id,
      member_id,
      promotion_id: promotion_id || null,
    });
    return Response.json({ action: 'liked' });
  }
}
