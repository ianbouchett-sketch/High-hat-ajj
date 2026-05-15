import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date();
  const d30ago = new Date(now - 30 * 86400000).toISOString().split('T')[0];
  const d60ago = new Date(now - 60 * 86400000).toISOString().split('T')[0];
  const d90ago = new Date(now - 90 * 86400000).toISOString();

  // ---- Retention from real session data ----
  const { data: sessions60 } = await supabase
    .from('sessions')
    .select('member_id, session_date, members(status)')
    .gte('session_date', d60ago);

  const validSessions = (sessions60 || []).filter(
    s => s.members?.status && !['walk_in', 'inactive'].includes(s.members.status)
  );

  const in60 = new Set(validSessions.map(s => s.member_id));
  const in30 = new Set(
    validSessions.filter(s => s.session_date >= d30ago).map(s => s.member_id)
  );
  const retentionPct = in60.size > 0 ? Math.round((in30.size / in60.size) * 100) : 0;

  // ---- Walk-in conversion from converted_from_walk_in_at column ----
  // All-time: everyone who was ever a walk-in (has a converted_from_walk_in_at, regardless of value,
  // OR is currently still walk_in)
  const { data: allWalkIns } = await supabase
    .from('members')
    .select('id, status, converted_from_walk_in_at')
    .or('converted_from_walk_in_at.not.is.null,status.eq.walk_in');

  const allTimeTotal = (allWalkIns || []).length;
  const allTimeConverted = (allWalkIns || []).filter(m => m.converted_from_walk_in_at !== null).length;
  const allTimePct = allTimeTotal > 0 ? Math.round((allTimeConverted / allTimeTotal) * 100) : 0;

  // Last 90 days: walk-ins who first appeared (converted_from_walk_in_at set within 90 days,
  // OR still walk_in with joined_at within 90 days)
  const { data: recent90 } = await supabase
    .from('members')
    .select('id, status, converted_from_walk_in_at, joined_at')
    .or(`converted_from_walk_in_at.gte.${d90ago},and(status.eq.walk_in,joined_at.gte.${d90ago})`);

  const recent90Total = (recent90 || []).length;
  const recent90Converted = (recent90 || []).filter(m => m.converted_from_walk_in_at !== null).length;
  const recent90Pct = recent90Total > 0 ? Math.round((recent90Converted / recent90Total) * 100) : 0;

  return Response.json({
    // Retention
    in60: in60.size,
    in30: in30.size,
    retentionPct,
    // Walk-in conversion
    walkInConversion: {
      allTime: { total: allTimeTotal, converted: allTimeConverted, pct: allTimePct },
      recent90: { total: recent90Total, converted: recent90Converted, pct: recent90Pct },
      hasData: allTimeTotal > 0,
    },
  });
}
