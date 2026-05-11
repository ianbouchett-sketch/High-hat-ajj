import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Merges fromId (walk_in record) INTO toId (auth-linked record)
// Transfers: sessions, promotions, posts, post_reactions, attendance_plans
// Copies: waiver data, training info, emergency contact if missing on target
// Then deletes the fromId record

export async function POST(request) {
  const { fromId, toId } = await request.json();
  if (!fromId || !toId) {
    return Response.json({ error: 'Missing fromId or toId.' }, { status: 400 });
  }
  if (fromId === toId) {
    return Response.json({ error: 'Cannot merge a record with itself.' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Fetch both records
  const [{ data: from }, { data: to }] = await Promise.all([
    supabase.from('members').select('*').eq('id', fromId).single(),
    supabase.from('members').select('*').eq('id', toId).single(),
  ]);

  if (!from) return Response.json({ error: 'Source member not found.' }, { status: 404 });
  if (!to) return Response.json({ error: 'Target member not found.' }, { status: 404 });

  try {
    // 1. Reassign sessions
    await supabase.from('sessions').update({ member_id: toId }).eq('member_id', fromId);

    // 2. Reassign promotions
    await supabase.from('promotions').update({ member_id: toId }).eq('member_id', fromId);

    // 3. Reassign posts
    await supabase.from('posts').update({ member_id: toId, member_name: to.name }).eq('member_id', fromId);

    // 4. Reassign post_reactions (skip conflicts -- unique constraint)
    const { data: fromReacts } = await supabase.from('post_reactions').select('post_id').eq('member_id', fromId);
    if (fromReacts?.length) {
      const { data: toReacts } = await supabase.from('post_reactions').select('post_id').eq('member_id', toId);
      const toPostIds = new Set((toReacts || []).map(r => r.post_id));
      const safeReacts = fromReacts.filter(r => !toPostIds.has(r.post_id));
      if (safeReacts.length) {
        await supabase.from('post_reactions').update({ member_id: toId }).in('post_id', safeReacts.map(r => r.post_id)).eq('member_id', fromId);
      }
      // Delete any remaining (duplicates)
      await supabase.from('post_reactions').delete().eq('member_id', fromId);
    }

    // 5. Reassign attendance_plans
    await supabase.from('attendance_plans').update({ member_id: toId }).eq('member_id', fromId);

    // 6. Reassign promotion_likes
    await supabase.from('promotion_likes').update({ member_id: toId }).eq('member_id', fromId);

    // 7. Copy waiver + training info to target if missing
    const updates = {};
    if (!to.waiver_signed_at && from.waiver_signed_at) {
      updates.waiver_signed_at = from.waiver_signed_at;
      updates.waiver_signed_by = from.waiver_signed_by;
    }
    if (!to.emergency_contact && from.emergency_contact) updates.emergency_contact = from.emergency_contact;
    if (!to.martial_arts_experience && from.martial_arts_experience) updates.martial_arts_experience = from.martial_arts_experience;
    if (!to.physical_limitations && from.physical_limitations) updates.physical_limitations = from.physical_limitations;
    if (!to.allergies_medications && from.allergies_medications) updates.allergies_medications = from.allergies_medications;
    if (!to.height_weight && from.height_weight) updates.height_weight = from.height_weight;
    if (!to.heard_about_us && from.heard_about_us) updates.heard_about_us = from.heard_about_us;
    if (!to.phone && from.phone) updates.phone = from.phone;
    if (!to.date_of_birth && from.date_of_birth) updates.date_of_birth = from.date_of_birth;
    if (!to.address_line1 && from.address_line1) updates.address_line1 = from.address_line1;
    if (!to.city && from.city) updates.city = from.city;
    if (!to.state && from.state) updates.state = from.state;
    if (!to.zip && from.zip) updates.zip = from.zip;

    // Recalculate session count
    const { count } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('member_id', toId);
    updates.sessions = count || 0;

    if (Object.keys(updates).length > 0) {
      await supabase.from('members').update(updates).eq('id', toId);
    }

    // 8. Delete the walk_in record
    await supabase.from('members').delete().eq('id', fromId);

    return Response.json({ success: true });
  } catch (err) {
    console.error('Merge error:', err);
    return Response.json({ error: err.message || 'Merge failed.' }, { status: 500 });
  }
}
