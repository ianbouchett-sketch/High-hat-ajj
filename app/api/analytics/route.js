import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

// Returns retention data computed from real session dates
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date();
  const d30ago = new Date(now - 30 * 86400000).toISOString().split('T')[0];
  const d60ago = new Date(now - 60 * 86400000).toISOString().split('T')[0];

  // Get all sessions in last 60 days (non-walk_in members only)
  const { data: sessions60 } = await supabase
    .from('sessions')
    .select('member_id, session_date, members(status)')
    .gte('session_date', d60ago)
    .order('session_date', { ascending: false });

  const validSessions = (sessions60 || []).filter(
    s => s.members?.status && !['walk_in', 'inactive'].includes(s.members.status)
  );

  // Members who trained in last 60 days
  const in60 = new Set(validSessions.map(s => s.member_id));
  // Members who trained in last 30 days
  const in30 = new Set(
    validSessions
      .filter(s => s.session_date >= d30ago)
      .map(s => s.member_id)
  );

  // Retention = of those who trained in 60 days, how many also trained in last 30
  const retention = in60.size > 0
    ? Math.round((in30.size / in60.size) * 100)
    : 0;

  return Response.json({
    in60: in60.size,
    in30: in30.size,
    retentionPct: retention,
  });
}
