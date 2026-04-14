import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  const body = await request.json();
  const {
    name, email, date_of_birth, gender, phone, parent_name,
    emergency_contact, address_line1, city, state, zip,
    martial_arts_experience, physical_limitations, allergies_medications,
    height_weight, heard_about_us, belt, stripes,
    waiver_signed_at, waiver_signed_by,
  } = body;

  if (!name || !email) {
    return Response.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Check if already in the system
  const { data: existing } = await supabase
    .from('members')
    .select('id, status')
    .eq('email', email)
    .single();

  if (existing) {
    // Already exists -- just refresh their waiver timestamp
    await supabase
      .from('members')
      .update({ waiver_signed_at, waiver_signed_by })
      .eq('id', existing.id);
    return Response.json({ success: true, existing: true });
  }

  // Insert as walk_in -- not pending, no portal access yet
  const { data: member, error: insertErr } = await supabase
    .from('members')
    .insert({
      name, email,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      phone: phone || null,
      parent_name: parent_name || null,
      emergency_contact: emergency_contact || null,
      address_line1: address_line1 || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      martial_arts_experience: martial_arts_experience || null,
      physical_limitations: physical_limitations || null,
      allergies_medications: allergies_medications || null,
      height_weight: height_weight || null,
      heard_about_us: heard_about_us || null,
      belt: belt || 'White',
      stripes: +stripes || 0,
      status: 'walk_in',
      joined_at: new Date().toISOString().split('T')[0],
      waiver_signed_at,
      waiver_signed_by,
    })
    .select()
    .single();

  if (insertErr) {
    console.error('Walk-in insert error:', insertErr);
    return Response.json({ error: insertErr.message }, { status: 500 });
  }

  // Send Supabase invite email so they can create a portal login later
  try {
    await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://high-hat-ajj.vercel.app/portal',
      data: { name },
    });
  } catch (inviteErr) {
    // Don't fail the request if invite fails -- they're still saved
    console.error('Invite email error:', inviteErr.message);
  }

  return Response.json({ success: true, memberId: member.id });
}
