import { getServiceSupabase } from '../../lib/supabase';
import AdminApp from '../../components/AdminApp';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = getServiceSupabase();

  const [{ data: members }, { data: schedule }] = await Promise.all([
    supabase
      .from('members')
      .select('*')
      .order('name'),
    supabase
      .from('schedule')
      .select('*')
      .eq('active', true)
      .order('day_of_week')
      .order('start_time'),
  ]);

  return (
    <AdminApp
      initialMembers={members || []}
      initialSchedule={schedule || []}
    />
  );
}
