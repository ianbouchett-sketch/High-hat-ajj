import { createClient } from '@supabase/supabase-js';
import AdminApp from '@/components/AdminApp';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const supabase = createClient(
    'https://rpkyxynurxntoqonfdni.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const [{ data: members }, { data: schedule }, { data: products }] = await Promise.all([
    supabase.from('members').select('*').order('name'),
    supabase.from('schedule').select('*').eq('active', true).order('day_of_week').order('start_time'),
    supabase.from('products').select('*').eq('active', true).order('name'),
  ]);

  return (
    <AdminApp
      initialMembers={members || []}
      initialSchedule={schedule || []}
      initialProducts={products || []}
    />
  );
}
