import { createClient } from '@supabase/supabase-js';
import AdminApp from '@/components/AdminApp';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createClient(
    'https://rpkyxynurxntoqonfdni.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: members, error } = await supabase
    .from('members')
    .select('*');

  console.log('members:', members, 'error:', error);

  const { data: schedule } = await supabase
    .from('schedule')
    .select('*');

  return (
    <AdminApp
      initialMembers={members || []}
      initialSchedule={schedule || []}
    />
  );
}
