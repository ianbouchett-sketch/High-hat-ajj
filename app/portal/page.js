import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import MemberPortal from '@/components/MemberPortal';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const memberId = session.user.id;

  const [{ data: member }, { data: sessions }, { data: schedule }] = await Promise.all([
    supabase.from('members').select('*').eq('id', memberId).single(),
    supabase.from('sessions').select('*').eq('member_id', memberId).order('session_date', { ascending: false }),
    supabase.from('schedule').select('*').eq('active', true).order('day_of_week').order('start_time'),
  ]);

  return (
    <MemberPortal
      initialMember={member}
      initialSessions={sessions || []}
      initialSchedule={schedule || []}
    />
  );
}
