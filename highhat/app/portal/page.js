import { getServiceSupabase } from '../../lib/supabase';
import MemberPortal from '../../components/MemberPortal';

export const dynamic = 'force-dynamic';

// Hardcoded demo member ID for now.
// Once auth is connected, this will come from the session:
// const { data: { session } } = await supabase.auth.getSession();
// const memberId = session?.user?.id;
const DEMO_MEMBER_ID = null;

export default async function PortalPage() {
  const supabase = getServiceSupabase();

  // Load schedule (public, no auth needed)
  const { data: schedule } = await supabase
    .from('schedule')
    .select('*')
    .eq('active', true)
    .order('day_of_week')
    .order('start_time');

  // If we have a real member ID, load their data
  let member = null;
  let sessions = [];

  if (DEMO_MEMBER_ID) {
    const [{ data: memberData }, { data: sessionData }] = await Promise.all([
      supabase.from('members').select('*').eq('id', DEMO_MEMBER_ID).single(),
      supabase
        .from('sessions')
        .select('*')
        .eq('member_id', DEMO_MEMBER_ID)
        .order('session_date', { ascending: false }),
    ]);
    member = memberData;
    sessions = sessionData || [];
  }

  return (
    <MemberPortal
      initialMember={member}
      initialSessions={sessions}
      initialSchedule={schedule || []}
    />
  );
}
