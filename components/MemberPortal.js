'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const G = '#c9a227', GD = '#8a6e18', GK = '#1a1600';
const BG = '#060606', CARD = '#0d0d0b', BL = '#2e2600';
const GRN = '#4a9e4a', ORG = '#c97316';
const F = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";
const FB = "'Barlow', 'Arial Narrow', Arial, sans-serif";

const BELT_CFG = {
  White:  { bg: '#e8e8e0', tx: '#111', br: '#bbb',  glow: 'rgba(220,220,210,.08)' },
  Blue:   { bg: '#1a3a6e', tx: '#fff', br: '#2a5aae', glow: 'rgba(42,90,174,.15)' },
  Purple: { bg: '#3e1460', tx: '#fff', br: '#6a2aaa', glow: 'rgba(106,42,170,.18)' },
  Brown:  { bg: '#4a2000', tx: '#fff', br: '#7a3e10', glow: 'rgba(122,62,16,.15)' },
  Black:  { bg: '#0a0a0a', tx: '#fff', br: '#3a3a3a', glow: 'rgba(255,255,255,.04)' },
};
const TYPE_CFG = {
  'Gi':        { bg: '#1a3a6e', br: '#2a5aae' },
  'No-Gi':     { bg: '#4a1a1a', br: '#8a2a2a' },
  'Wrestling': { bg: '#1a3a1a', br: '#2a6a2a' },
  'Judo':      { bg: '#3a1a00', br: '#7a4a00' },
  'Open Mat':  { bg: '#1a1a3a', br: '#3a3a8a' },
  'Other':     { bg: '#222',    br: '#444' },
};
const DAYS  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYSS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MILESTONES = [
  { n: 10,  l: 'First 10',        i: '🥋' },
  { n: 50,  l: '50 Sessions',     i: '⚡' },
  { n: 100, l: 'Century',         i: '💯' },
  { n: 200, l: 'Dedicated',       i: '🔥' },
  { n: 365, l: 'Year on the Mat', i: '📅' },
  { n: 500, l: '500 Club',        i: '🏆' },
];
const AVATAR_COLORS = ['#3e1460','#1a3a6e','#c9a227','#4a2000','#0a3a0a','#3a0a0a','#222','#1a2a3a'];
const TODAY = new Date();
const TODAYSTR = TODAY.toISOString().split('T')[0];

const ini = n => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const fmtL = d => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
const fmtS = d => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtM = d => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

function computeStreak(sessions) {
  if (!sessions.length) return 0;
  const sorted = [...sessions].sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  let streak = 0, cursor = new Date(TODAY);
  for (const s of sorted) {
    const d = new Date(s.session_date);
    if (Math.round((cursor - d) / 86400000) <= 2) { streak++; cursor = d; } else break;
  }
  return streak;
}

// ---- Shared UI ----
function Card({ children, style = {} }) {
  return <div style={{ background: CARD, border: `1px solid ${BL}`, borderRadius: 5, marginBottom: 10, overflow: 'hidden', ...style }}>{children}</div>;
}
function SLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 12, height: 1, background: G, opacity: .5 }} />
      <span style={{ color: GD, fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', fontFamily: F }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: BL }} />
    </div>
  );
}
function GBtn({ children, onClick, style = {} }) {
  return <button onClick={onClick} style={{ padding: '9px 18px', background: G, border: 'none', borderRadius: 3, color: '#000', fontWeight: 800, fontSize: 12, fontFamily: F, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', ...style }}>{children}</button>;
}
function GhBtn({ children, onClick, style = {} }) {
  return <button onClick={onClick} style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${BL}`, borderRadius: 3, color: '#555', fontSize: 11, fontFamily: F, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', ...style }}>{children}</button>;
}
function TypePill({ type }) {
  const c = TYPE_CFG[type] || TYPE_CFG.Other;
  return <span style={{ padding: '2px 7px', background: c.bg, border: `1px solid ${c.br}`, borderRadius: 2, fontSize: 9, fontWeight: 800, fontFamily: F, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>{type}</span>;
}
function BeltBar({ belt, stripes }) {
  const c = BELT_CFG[belt] || BELT_CFG.White, sc = belt === 'White' ? '#111' : '#fff';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 180, height: 28, background: c.bg, border: `2px solid ${c.br}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', boxShadow: `0 0 24px ${c.glow}` }}>
        <span style={{ fontSize: 11, fontWeight: 800, fontFamily: F, color: c.tx, letterSpacing: 2, textTransform: 'uppercase' }}>{belt} Belt</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0,1,2,3,4].map(i => <div key={i} style={{ width: 8, height: 20, borderRadius: 2, background: i < stripes ? sc : 'transparent', border: `1px solid ${i < stripes ? sc : (belt === 'White' ? '#aaa' : c.br)}`, opacity: i < stripes ? 1 : 0.25 }} />)}
        </div>
      </div>
      <div style={{ color: '#3a3200', fontSize: 10, fontFamily: F, fontWeight: 700, letterSpacing: 1 }}>{stripes} of 4 stripes</div>
    </div>
  );
}
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#0a0a0a', border: `1px solid ${BL}`, borderRadius: 6, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ height: 3, background: G, opacity: .85 }} />
        <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 2, color: '#fff', textTransform: 'uppercase', marginBottom: 20, fontFamily: F }}>{title}</div>
          {children}
        </div>
      </div>
    </div>
  );
}
function FL({ children }) {
  return <div style={{ color: GD, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, fontWeight: 800, fontFamily: F }}>{children}</div>;
}

// ---- DEMO fallback member (used until auth is wired) ----
const DEMO_MEMBER = {
  id: 'demo',
  name: 'Demo Member',
  email: 'demo@highhatbjj.com',
  phone: '',
  address: '',
  emergency_contact: '',
  belt: 'White',
  stripes: 0,
  joined_at: TODAYSTR,
  status: 'active',
  next_payment_date: TODAYSTR,
  avatar_color: '#3e1460',
  sessions: 0,
};

// ---- ROOT MEMBER PORTAL ----
export default function MemberPortal({ initialMember, initialSessions, initialSchedule }) {
  const [member, setMember] = useState(initialMember || DEMO_MEMBER);
  const [sessions, setSessions] = useState(initialSessions || []);
  const [view, setView] = useState('home');
  const [showLog, setShowLog] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [toast, setToast] = useState(null);
  const [logDate, setLogDate] = useState(TODAYSTR);
  const [logNote, setLogNote] = useState('');
  const [editForm, setEditForm] = useState({ phone: '', address: '', emergency_contact: '', avatar_color: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const cnt = sessions.length;
  const streak = computeStreak(sessions);
  const earned = MILESTONES.filter(m => cnt >= m.n);
  const next = MILESTONES.find(m => cnt < m.n);
  const isOD = member.status === 'overdue';

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800); }

  async function logSession() {
    if (sessions.find(s => s.session_date === logDate)) { showToast('Already logged for that date.'); setShowLog(false); return; }
    setSaving(true);
    const newSession = { member_id: member.id, session_date: logDate, note: logNote };
    if (member.id !== 'demo') {
      const { data } = await supabase.from('sessions').insert(newSession).select().single();
      if (data) setSessions(s => [data, ...s]);
    } else {
      setSessions(s => [{ id: Date.now(), ...newSession }, ...s]);
    }
    setLogNote(''); setShowLog(false); setSaving(false);
    showToast('Session logged.');
  }

  function openEdit() {
    setEditForm({ phone: member.phone || '', address: member.address || '', emergency_contact: member.emergency_contact || '', avatar_color: member.avatar_color || '#3e1460' });
    setShowEdit(true);
  }

  async function saveProfile() {
    setSaving(true);
    if (member.id !== 'demo') {
      await supabase.from('members').update({ phone: editForm.phone, address: editForm.address, emergency_contact: editForm.emergency_contact, avatar_color: editForm.avatar_color }).eq('id', member.id);
    }
    setMember(m => ({ ...m, ...editForm }));
    setSaving(false); setShowEdit(false); showToast('Profile updated.');
  }

  const navs = [
    { id: 'home',     l: 'Home' },
    { id: 'journal',  l: 'Journal' },
    { id: 'schedule', l: 'Schedule' },
    { id: 'profile',  l: 'Profile' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: FB }}>
      {toast && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#1a1600', border: `1px solid ${GD}`, borderRadius: 4, padding: '11px 18px', color: G, fontSize: 13, fontWeight: 800, fontFamily: F, letterSpacing: 1, zIndex: 300, whiteSpace: 'nowrap' }}>{toast}</div>}

      <div style={{ height: 3, background: G }} />
      <div style={{ background: BG, borderBottom: `1px solid ${BL}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 58, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: G, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#000', fontFamily: F, letterSpacing: 1 }}>HH</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 3, color: G, textTransform: 'uppercase', fontFamily: F, lineHeight: 1 }}>High Hat</div>
            <div style={{ fontSize: 8, color: '#444', letterSpacing: 2, textTransform: 'uppercase', fontFamily: F }}>Member Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {navs.map(n => <button key={n.id} onClick={() => setView(n.id)} style={{ padding: '7px 12px', background: view === n.id ? G : 'transparent', border: view === n.id ? 'none' : `1px solid ${BL}`, borderRadius: 3, color: view === n.id ? '#000' : '#555', fontSize: 11, fontWeight: 800, fontFamily: F, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer' }}>{n.l}</button>)}
        </div>
        <GBtn onClick={() => setShowLog(true)} style={{ fontSize: 11, padding: '8px 14px' }}>+ Session</GBtn>
      </div>

      <div style={{ padding: '24px 24px' }}>

        {/* HOME */}
        {view === 'home' && (
          <div>
            {isOD && <div style={{ background: '#120700', border: '1px solid #7a3300', borderRadius: 4, padding: '14px 16px', marginBottom: 10, color: ORG, fontSize: 14, fontFamily: F, fontWeight: 700 }}>Payment Overdue — Contact the gym to update your billing.</div>}

            <Card style={{ background: `radial-gradient(ellipse at 90% 0%, ${BELT_CFG[member.belt]?.glow || 'transparent'} 0%, ${CARD} 55%)` }}>
              <div style={{ height: 3, background: G, opacity: .7 }} />
              <div style={{ padding: '22px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 3, background: member.avatar_color || '#3e1460', border: `2px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: G, fontFamily: F, letterSpacing: 1.5, flexShrink: 0 }}>{ini(member.name)}</div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, fontFamily: F, letterSpacing: 1, lineHeight: 1 }}>{member.name}</div>
                    <div style={{ color: '#3a3200', fontSize: 10, marginTop: 5, fontFamily: F, letterSpacing: 1 }}>Member since {member.joined_at ? new Date(member.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</div>
                  </div>
                </div>
                <BeltBar belt={member.belt} stripes={member.stripes} />
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[{ l: 'Sessions', v: cnt, c: G }, { l: 'Streak', v: `${streak}d`, c: GRN }, { l: 'Status', v: isOD ? 'Overdue' : 'Paid Up', c: isOD ? ORG : GRN }].map(s => (
                <div key={s.l} style={{ background: CARD, border: `1px solid ${BL}`, borderRadius: 4, padding: '14px 10px', textAlign: 'center' }}>
                  <div style={{ color: '#2e2800', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, fontFamily: F }}>{s.l}</div>
                  <div style={{ color: s.c, fontSize: 26, fontWeight: 800, fontFamily: F, marginTop: 4 }}>{s.v}</div>
                </div>
              ))}
            </div>

            <Card>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#2e2800', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, fontFamily: F }}>Next Payment</div>
                  <div style={{ color: isOD ? ORG : '#fff', fontSize: 17, fontWeight: 800, fontFamily: F, marginTop: 4 }}>{member.next_payment_date ? fmtM(member.next_payment_date) : '—'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: isOD ? ORG : GRN }} />
                  <span style={{ color: isOD ? ORG : GRN, fontSize: 12, fontWeight: 800, fontFamily: F, letterSpacing: 1 }}>{isOD ? 'Overdue' : 'Paid Up'}</span>
                </div>
              </div>
            </Card>

            {next && (
              <Card>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ color: '#2e2800', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, fontFamily: F, marginBottom: 4 }}>Next Milestone</div>
                      <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: F, letterSpacing: .5 }}>{next.i} {next.l}</div>
                    </div>
                    <span style={{ color: G, fontWeight: 800, fontSize: 13, fontFamily: F }}>{cnt}/{next.n}</span>
                  </div>
                  <div style={{ height: 4, background: '#111', borderRadius: 2 }}><div style={{ height: 4, borderRadius: 2, background: G, width: `${Math.min((cnt / next.n) * 100, 100)}%` }} /></div>
                  <div style={{ color: '#2a2200', fontSize: 11, marginTop: 8, fontFamily: F }}>{next.n - cnt} sessions to go</div>
                </div>
              </Card>
            )}

            {earned.length > 0 && (
              <Card>
                <div style={{ padding: '14px 16px' }}>
                  <SLabel>Earned</SLabel>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {earned.map(m => (
                      <div key={m.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: '#111', border: `1px solid ${BL}`, borderRadius: 4, padding: '12px 14px', minWidth: 70 }}>
                        <span style={{ fontSize: 22 }}>{m.i}</span>
                        <span style={{ color: G, fontSize: 9, fontWeight: 800, textAlign: 'center', fontFamily: F, letterSpacing: 1, textTransform: 'uppercase' }}>{m.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <SLabel>Recent Sessions</SLabel>
                  <button onClick={() => setView('journal')} style={{ background: 'none', border: 'none', color: GD, fontSize: 10, cursor: 'pointer', fontFamily: F, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 800, padding: 0, marginLeft: 10 }}>View All</button>
                </div>
                {sessions.slice(0, 4).map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${BL}` }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: G, flexShrink: 0 }} />
                    <span style={{ color: '#555', fontSize: 13, fontFamily: F }}>{fmtS(s.session_date)}</span>
                    {s.note && <span style={{ color: '#2a2a2a', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.note}</span>}
                  </div>
                ))}
                {sessions.length === 0 && <div style={{ color: '#2a2a2a', fontSize: 13, fontFamily: F }}>No sessions logged yet.</div>}
              </div>
            </Card>
          </div>
        )}

        {/* JOURNAL */}
        {view === 'journal' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 2, color: G, textTransform: 'uppercase', fontFamily: F }}>Training Journal</div>
                <div style={{ color: '#3a3200', fontSize: 12, marginTop: 3, fontFamily: F }}>{cnt} total sessions logged</div>
              </div>
              <GBtn onClick={() => setShowLog(true)} style={{ fontSize: 11, padding: '8px 14px' }}>+ Log</GBtn>
            </div>
            <Card>
              <div style={{ padding: '4px 16px' }}>
                {[...sessions].sort((a, b) => new Date(b.session_date) - new Date(a.session_date)).map(s => (
                  <div key={s.id} onClick={() => s.note && setExpandedId(expandedId === s.id ? null : s.id)} style={{ padding: '12px 0', borderBottom: `1px solid ${BL}`, cursor: s.note ? 'pointer' : 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: G, flexShrink: 0 }} />
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: F, letterSpacing: .5 }}>{fmtL(s.session_date)}</span>
                      </div>
                      {s.note && <span style={{ color: '#333', fontSize: 14 }}>›</span>}
                    </div>
                    {s.note && expandedId !== s.id && <div style={{ color: '#2a2a2a', fontSize: 12, marginTop: 5, paddingLeft: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.note}</div>}
                    {s.note && expandedId === s.id && <div style={{ color: '#777', fontSize: 13, marginTop: 8, paddingLeft: 16, lineHeight: 1.7, borderLeft: `2px solid ${BL}` }}>{s.note}</div>}
                  </div>
                ))}
                {sessions.length === 0 && <div style={{ color: '#2a2a2a', padding: '24px 0', fontFamily: F }}>No sessions yet. Log your first one!</div>}
              </div>
            </Card>
          </div>
        )}

        {/* SCHEDULE */}
        {view === 'schedule' && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 2, color: G, textTransform: 'uppercase', fontFamily: F, marginBottom: 18 }}>Class Schedule</div>
            {DAYS.map((day, di) => {
              const cls = initialSchedule.filter(c => c.day_of_week === di).sort((a, b) => a.start_time.localeCompare(b.start_time));
              return (
                <Card key={day}>
                  <div style={{ display: 'flex', gap: 14, padding: '14px 16px', alignItems: cls.length ? 'flex-start' : 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 3, background: cls.length ? GK : 'transparent', border: `1.5px solid ${cls.length ? GD : BL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, fontFamily: F, letterSpacing: 1.5, color: cls.length ? G : '#2a2a2a', flexShrink: 0 }}>{DAYSS[di].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      {cls.length === 0 ? <span style={{ color: '#2a2a2a', fontSize: 13, fontFamily: F }}>Rest Day</span>
                        : cls.map(c => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            <span style={{ color: G, fontSize: 14, fontWeight: 800, fontFamily: F, flexShrink: 0 }}>{c.start_time.slice(0, 5)}</span>
                            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: F }}>{c.class_name}</span>
                            <TypePill type={c.type} />
                            {c.instructor && <span style={{ color: '#444', fontSize: 12, fontFamily: FB }}>{c.instructor}</span>}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* PROFILE */}
        {view === 'profile' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 2, color: G, textTransform: 'uppercase', fontFamily: F }}>My Profile</div>
              <GhBtn onClick={openEdit}>Edit</GhBtn>
            </div>
            <Card>
              <div style={{ padding: '18px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 54, height: 54, borderRadius: 3, background: member.avatar_color || '#3e1460', border: `2px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: G, fontFamily: F, letterSpacing: 1.5, flexShrink: 0 }}>{ini(member.name)}</div>
                <div>
                  <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, fontFamily: F, letterSpacing: .5 }}>{member.name}</div>
                  <div style={{ color: '#444', fontSize: 12, marginTop: 2, fontFamily: FB }}>{member.email}</div>
                  <div style={{ marginTop: 12 }}><BeltBar belt={member.belt} stripes={member.stripes} /></div>
                </div>
              </div>
            </Card>
            {[{ l: 'Phone', v: member.phone, i: '📱' }, { l: 'Address', v: member.address, i: '📍' }, { l: 'Emergency Contact', v: member.emergency_contact, i: '🚨' }].map(f => (
              <Card key={f.l}>
                <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>{f.i}</span>
                  <div>
                    <div style={{ color: '#2e2800', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, fontFamily: F }}>{f.l}</div>
                    <div style={{ color: f.v ? '#fff' : '#2a2a2a', fontSize: 14, marginTop: 4, fontFamily: FB }}>{f.v || 'Not set'}</div>
                  </div>
                </div>
              </Card>
            ))}
            <Card>
              <div style={{ padding: '14px 16px' }}>
                <SLabel>Membership</SLabel>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#2e2800', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, fontFamily: F }}>Joined</div>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: F, marginTop: 4 }}>{member.joined_at ? fmtM(member.joined_at) : '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#2e2800', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, fontFamily: F }}>Next Billing</div>
                    <div style={{ color: isOD ? ORG : GRN, fontSize: 14, fontWeight: 700, fontFamily: F, marginTop: 4 }}>{member.next_payment_date ? fmtM(member.next_payment_date) : '—'}</div>
                  </div>
                </div>
              </div>
            </Card>
            <button style={{ width: '100%', padding: 12, background: 'transparent', border: `1px solid ${BL}`, borderRadius: 3, color: '#333', fontSize: 11, fontFamily: F, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', marginTop: 4 }}>Sign Out</button>
          </div>
        )}
      </div>

      {/* Log Session Modal */}
      <Modal open={showLog} onClose={() => setShowLog(false)} title="Log Session">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><FL>Date</FL><input type="date" value={logDate} max={TODAYSTR} onChange={e => setLogDate(e.target.value)} style={{ width: '100%', background: '#111', border: `1px solid ${BL}`, borderRadius: 3, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: FB, colorScheme: 'dark', boxSizing: 'border-box' }} /></div>
          <div><FL>Journal Note <span style={{ color: '#2a2a2a', fontWeight: 400 }}>(optional)</span></FL><textarea value={logNote} onChange={e => setLogNote(e.target.value)} rows={3} placeholder="What did you work on today?" style={{ width: '100%', background: '#111', border: `1px solid ${BL}`, borderRadius: 3, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: FB, resize: 'none', boxSizing: 'border-box' }} /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <GhBtn onClick={() => setShowLog(false)} style={{ flex: 1 }}>Cancel</GhBtn>
            <GBtn onClick={logSession} style={{ flex: 2, opacity: saving ? .6 : 1 }}>{saving ? 'Saving...' : 'Log It'}</GBtn>
          </div>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Profile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[{ k: 'phone', l: 'Phone', p: '802-555-0000' }, { k: 'address', l: 'Address', p: '123 Main St...' }, { k: 'emergency_contact', l: 'Emergency Contact', p: 'Name - Phone number' }].map(f => (
            <div key={f.k}>
              <FL>{f.l}</FL>
              <input value={editForm[f.k]} onChange={e => setEditForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.p}
                style={{ width: '100%', background: '#111', border: `1px solid ${BL}`, borderRadius: 3, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: FB, boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <FL>Avatar Color</FL>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              {AVATAR_COLORS.map(c => <div key={c} onClick={() => setEditForm(f => ({ ...f, avatar_color: c }))} style={{ width: 30, height: 30, borderRadius: 3, background: c, cursor: 'pointer', border: editForm.avatar_color === c ? `2px solid ${G}` : '2px solid transparent', boxSizing: 'border-box' }} />)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <GhBtn onClick={() => setShowEdit(false)} style={{ flex: 1 }}>Cancel</GhBtn>
            <GBtn onClick={saveProfile} style={{ flex: 2, opacity: saving ? .6 : 1 }}>{saving ? 'Saving...' : 'Save'}</GBtn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
