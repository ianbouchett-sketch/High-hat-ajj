'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MemberPortal from '@/components/MemberPortal';

export default function PortalPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/login'; return; }

      const memberId = session.user.id;
      const [{ data: member }, { data: sessions }, { data: schedule }] = await Promise.all([
        supabase.from('members').select('*').eq('id', memberId).single(),
        supabase.from('sessions').select('*').eq('member_id', memberId).order('session_date', { ascending: false }),
        supabase.from('schedule').select('*').eq('active', true).order('day_of_week').order('start_time'),
      ]);

      setData({ member, sessions: sessions || [], schedule: schedule || [] });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#c9a227', fontFamily: "'Barlow Condensed', Arial, sans-serif", fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>Loading...</div>
    </div>
  );

  return <MemberPortal initialMember={data.member} initialSessions={data.sessions} initialSchedule={data.schedule} />;
}
