'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ---- Theme ----
const G = '#c9a227', GD = '#8a6e18', GK = '#1a1600';
const BG = '#060606', CARD = '#0d0d0b', BL = '#2e2600';
const GRN = '#4a9e4a', ORG = '#c97316';
const F = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";
const FB = "'Barlow', 'Arial Narrow', Arial, sans-serif";

const BELT_CFG = {
  White:  { bg: '#e8e8e0', tx: '#111', br: '#bbb' },
  Blue:   { bg: '#1a3a6e', tx: '#fff', br: '#2a5aae' },
  Purple: { bg: '#3e1460', tx: '#fff', br: '#6a2aaa' },
  Brown:  { bg: '#4a2000', tx: '#fff', br: '#7a3e10' },
  Black:  { bg: '#0a0a0a', tx: '#fff', br: '#3a3a3a' },
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
const BELTS = ['White','Blue','Purple','Brown','Black'];
const TYPES = ['Gi','No-Gi','Wrestling','Judo','Open Mat','Other'];
const TODAY = new Date();

// ---- Helpers ----
const ini = n => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const dAgo = d => Math.floor((TODAY - new Date(d)) / 86400000);
const dOD  = lp => { const d = new Date(lp); d.setMonth(d.getMonth() + 1); return Math.max(0, Math.floor((TODAY - d) / 86400000)); };
const nxPay = lp => { const d = new Date(lp); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const todayStr = () => new Date().toISOString().split('T')[0];

// ---- Shared UI ----
function SLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 12, height: 1, background: G, opacity: .5 }} />
      <span style={{ color: GD, fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', fontFamily: F }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: BL }} />
    </div>
  );
}
function Card({ children, style = {} }) {
  return <div style={{ background: CARD, border: `1px solid ${BL}`, borderRadius: 5, marginBottom: 8, overflow: 'hidden', ...style }}>{children}</div>;
}
function GBtn({ children, onClick, style = {}, small }) {
  return <button onClick={onClick} style={{ padding: small ? '6px 14px' : '9px 18px', background: G, border: 'none', borderRadius: 3, color: '#000', fontWeight: 800, fontSize: small ? 11 : 13, fontFamily: F, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', ...style }}>{children}</button>;
}
function GhBtn({ children, onClick, style = {} }) {
  return <button onClick={onClick} style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${BL}`, borderRadius: 3, color: '#555', fontSize: 11, fontFamily: F, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', ...style }}>{children}</button>;
}
function BeltBadge({ belt, stripes, lg }) {
  const c = BELT_CFG[belt] || BELT_CFG.White, sc = belt === 'White' ? '#111' : '#fff';
  const h = lg ? 22 : 16, w = lg ? 90 : 64, sw = lg ? 6 : 4;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', background: c.bg, border: `1.5px solid ${c.br}`, borderRadius: 2, width: w, height: h, padding: '0 4px', flexShrink: 0, gap: 2 }}>
      <span style={{ fontSize: lg ? 9 : 7, fontWeight: 800, fontFamily: F, color: c.tx, letterSpacing: 1, textTransform: 'uppercase' }}>{belt}</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {[0,1,2,3,4].map(i => <div key={i} style={{ width: sw, height: h - 4, borderRadius: 1, background: i < stripes ? sc : 'transparent', border: `1px solid ${i < stripes ? sc : (belt === 'White' ? '#aaa' : c.br)}`, opacity: i < stripes ? 1 : 0.3 }} />)}
      </div>
    </div>
  );
}
function StatusDot({ status }) {
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: { active: GRN, overdue: ORG, inactive: '#444' }[status] || '#444', flexShrink: 0 }} />;
}
function TypePill({ type }) {
  const c = TYPE_CFG[type] || TYPE_CFG.Other;
  return <span style={{ padding: '2px 7px', background: c.bg, border: `1px solid ${c.br}`, borderRadius: 2, fontSize: 9, fontWeight: 800, fontFamily: F, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>{type}</span>;
}
function FieldLabel({ children }) {
  return <div style={{ color: GD, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, fontWeight: 800, fontFamily: F }}>{children}</div>;
}
function FInput({ value, onChange, placeholder, type = 'text' }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{ width: '100%', background: '#111', border: `1px solid ${BL}`, borderRadius: 3, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: FB, WebkitAppearance: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />;
}
function FSelect({ value, onChange, options }) {
  return <select value={value} onChange={onChange}
    style={{ width: '100%', background: '#111', border: `1px solid ${BL}`, borderRadius: 3, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: FB, WebkitAppearance: 'none', colorScheme: 'dark', boxSizing: 'border-box' }}>
    {options.map(o => typeof o === 'object' ? <option key={o.v} value={o.v}>{o.l}</option> : <option key={o}>{o}</option>)}
  </select>;
}
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#0a0a0a', border: `1px solid ${BL}`, borderRadius: 6, width: '100%', maxWidth: wide ? 480 : 420, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ height: 3, background: G, opacity: .85 }} />
        <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 2, color: '#fff', textTransform: 'uppercase', marginBottom: 20, fontFamily: F }}>{title}</div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---- ROSTER VIEW ----
function RosterView({ members, setMembers, openDetail }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', belt: 'White', stripes: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const list = members.filter(m =>
    (filter === 'all' || m.status === filter) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  async function addMember() {
    if (!form.name.trim()) return;
    setSaving(true); setError(null);
    const { data, error: err } = await supabase
      .from('members')
      .insert({ name: form.name.trim(), belt: form.belt, stripes: +form.stripes, status: 'active', joined_at: todayStr(), last_payment: todayStr() })
      .select()
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    setMembers(ms => [...ms, data].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAdd(false); setForm({ name: '', belt: 'White', stripes: 0 });
  }

  return (
    <>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
        style={{ width: '100%', background: CARD, border: `1px solid ${BL}`, borderRadius: 3, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: FB, boxSizing: 'border-box', marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all','active','overdue','inactive'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', background: filter === f ? GK : 'transparent', border: `1px solid ${filter === f ? GD : BL}`, borderRadius: 3, color: filter === f ? G : '#555', fontSize: 11, fontWeight: 800, fontFamily: F, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer' }}>{f}</button>
        ))}
        <GBtn onClick={() => setShowAdd(true)} small style={{ marginLeft: 'auto' }}>+ Member</GBtn>
      </div>

      {list.map(m => {
        const od = m.status === 'overdue' ? dOD(m.last_payment) : 0;
        const sc = m.status === 'overdue' ? ORG : m.status === 'active' ? GRN : '#444';
        return (
          <Card key={m.id}>
            <div onClick={() => openDetail(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 3, background: '#141400', border: `1.5px solid ${GD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G, fontSize: 13, fontWeight: 800, fontFamily: F, flexShrink: 0 }}>{ini(m.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: F, letterSpacing: .5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                <div style={{ marginTop: 5 }}><BeltBadge belt={m.belt} stripes={m.stripes} /></div>
              </div>
              <div style={{ color: '#2a2a2a', fontSize: 12, fontFamily: F, whiteSpace: 'nowrap' }}>{m.sessions || 0} sessions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <StatusDot status={m.status} />
                <span style={{ fontSize: 12, color: sc, fontFamily: F, fontWeight: 700 }}>{m.status === 'overdue' ? `${od}d overdue` : m.status}</span>
              </div>
            </div>
          </Card>
        );
      })}
      {list.length === 0 && <div style={{ textAlign: 'center', color: '#2a2a2a', padding: '48px 0', fontFamily: F }}>No members found</div>}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Member">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div style={{ color: ORG, fontSize: 13, fontFamily: FB }}>{error}</div>}
          <div><FieldLabel>Full Name</FieldLabel><FInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Marcus Tavares" /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><FieldLabel>Belt</FieldLabel><FSelect value={form.belt} onChange={e => setForm(f => ({ ...f, belt: e.target.value }))} options={BELTS} /></div>
            <div style={{ flex: 1 }}><FieldLabel>Stripes</FieldLabel><FSelect value={form.stripes} onChange={e => setForm(f => ({ ...f, stripes: +e.target.value }))} options={[0,1,2,3,4].map(n => ({ v: n, l: n }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <GhBtn onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancel</GhBtn>
            <GBtn onClick={addMember} style={{ flex: 2, opacity: saving ? .6 : 1 }}>{saving ? 'Saving...' : 'Add Member'}</GBtn>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ---- MEMBER DETAIL MODAL ----
function DetailModal({ id, members, setMembers, onClose }) {
  const m = members.find(x => x.id === id);
  const [belt, setBelt] = useState(m?.belt || 'White');
  const [stripes, setStripes] = useState(m?.stripes || 0);
  const [saving, setSaving] = useState(false);
  if (!m) return null;
  const od = m.status === 'overdue' ? dOD(m.last_payment) : 0;

  async function saveBelt() {
    setSaving(true);
    await supabase.from('members').update({ belt, stripes }).eq('id', id);
    setMembers(ms => ms.map(x => x.id === id ? { ...x, belt, stripes } : x));
    setSaving(false);
  }
  async function logSession() {
    setSaving(true);
    const newCount = (m.sessions || 0) + 1;
    await supabase.from('members').update({ sessions: newCount }).eq('id', id);
    await supabase.from('sessions').insert({ member_id: id, session_date: todayStr() });
    setMembers(ms => ms.map(x => x.id === id ? { ...x, sessions: newCount } : x));
    setSaving(false);
  }
  async function setStatus(status) {
    setSaving(true);
    const updates = { status };
    if (status === 'active') updates.last_payment = todayStr();
    await supabase.from('members').update(updates).eq('id', id);
    setMembers(ms => ms.map(x => x.id === id ? { ...x, ...updates } : x));
    setSaving(false);
    onClose();
  }

  return (
    <Modal open title="Member" onClose={onClose} wide>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ width: 50, height: 50, borderRadius: 3, background: '#141400', border: `2px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G, fontSize: 17, fontWeight: 800, fontFamily: F, flexShrink: 0 }}>{ini(m.name)}</div>
        <div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, fontFamily: F, letterSpacing: .5 }}>{m.name}</div>
          <div style={{ marginTop: 6 }}><BeltBadge belt={m.belt} stripes={m.stripes} lg /></div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[{ l: 'Sessions', v: m.sessions || 0 }, { l: 'Status', v: m.status }, { l: 'Since', v: m.joined_at ? new Date(m.joined_at).getFullYear() : '—' }].map(x => (
          <div key={x.l} style={{ background: '#111', border: `1px solid ${BL}`, borderRadius: 4, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ color: '#2a2200', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, fontFamily: F }}>{x.l}</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, fontFamily: F, marginTop: 4 }}>{x.v}</div>
          </div>
        ))}
      </div>
      {m.status === 'overdue' && <div style={{ background: '#1a0800', border: '1px solid #7a3300', borderRadius: 4, padding: '12px 14px', marginBottom: 12, color: ORG, fontSize: 13, fontFamily: FB }}>Payment {od} day{od !== 1 ? 's' : ''} overdue</div>}
      <div style={{ background: '#111', border: `1px solid ${BL}`, borderRadius: 4, padding: '14px 16px', marginBottom: 12 }}>
        <SLabel>Payment</SLabel>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><div style={{ color: '#444', fontSize: 11, fontFamily: FB }}>Last paid</div><div style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: F, marginTop: 2 }}>{m.last_payment ? fmt(m.last_payment) : '—'}</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ color: '#444', fontSize: 11, fontFamily: FB }}>Next due</div><div style={{ color: m.status === 'overdue' ? ORG : GRN, fontSize: 14, fontWeight: 700, fontFamily: F, marginTop: 2 }}>{m.last_payment ? nxPay(m.last_payment) : '—'}</div></div>
        </div>
      </div>
      <div style={{ background: '#111', border: `1px solid ${BL}`, borderRadius: 4, padding: '14px 16px', marginBottom: 12 }}>
        <SLabel>Update Belt</SLabel>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}><FSelect value={belt} onChange={e => setBelt(e.target.value)} options={BELTS} /></div>
          <div style={{ width: 80 }}><FSelect value={stripes} onChange={e => setStripes(+e.target.value)} options={[0,1,2,3,4].map(n => ({ v: n, l: n }))} /></div>
          <GBtn onClick={saveBelt} small style={{ opacity: saving ? .6 : 1 }}>Save</GBtn>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button onClick={logSession} disabled={saving} style={{ flex: 1, padding: 12, background: '#0a1a0a', border: `1px solid #2a5a2a`, borderRadius: 4, color: GRN, fontSize: 12, fontWeight: 800, fontFamily: F, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>+ Session</button>
        {m.status !== 'active'
          ? <button onClick={() => setStatus('active')} disabled={saving} style={{ flex: 1, padding: 12, background: '#0a1a0a', border: `1px solid #2a5a2a`, borderRadius: 4, color: GRN, fontSize: 12, fontWeight: 800, fontFamily: F, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>Mark Active</button>
          : <button onClick={() => setStatus('inactive')} disabled={saving} style={{ flex: 1, padding: 12, background: '#111', border: `1px solid ${BL}`, borderRadius: 4, color: '#444', fontSize: 12, fontFamily: F, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>Deactivate</button>
        }
      </div>
      <GhBtn onClick={onClose} style={{ width: '100%', textAlign: 'center' }}>Close</GhBtn>
    </Modal>
  );
}

// ---- PAYMENTS VIEW ----
function PaymentsView({ members, setMembers }) {
  const [saving, setSaving] = useState(null);
  const sorted = [...members].sort((a, b) => ({ overdue: 0, active: 1, inactive: 2 }[a.status] - { overdue: 0, active: 1, inactive: 2 }[b.status]));
  const od = members.filter(m => m.status === 'overdue').length;

  async function markPaid(id) {
    setSaving(id);
    const lp = todayStr();
    await supabase.from('members').update({ status: 'active', last_payment: lp }).eq('id', id);
    setMembers(ms => ms.map(m => m.id === id ? { ...m, status: 'active', last_payment: lp } : m));
    setSaving(null);
  }

  return (
    <>
      {od > 0 && <div style={{ background: '#120700', border: '1px solid #7a3300', borderRadius: 4, padding: '14px 16px', marginBottom: 14, color: ORG, fontSize: 14, fontFamily: F, fontWeight: 700, letterSpacing: .5 }}>{od} member{od !== 1 ? 's' : ''} with overdue payments</div>}
      {sorted.map(m => {
        const isOD = m.status === 'overdue';
        const nx = m.last_payment ? new Date(m.last_payment) : null;
        if (nx) nx.setMonth(nx.getMonth() + 1);
        const od2 = isOD ? dOD(m.last_payment) : 0;
        return (
          <Card key={m.id} style={isOD ? { background: '#0e0600', borderColor: '#3a1800' } : {}}>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 3, background: '#141400', border: `1.5px solid ${GD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G, fontSize: 12, fontWeight: 800, fontFamily: F, flexShrink: 0 }}>{ini(m.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: F, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                  <div style={{ color: '#333', fontSize: 11, marginTop: 2, fontFamily: F }}>Last paid {m.last_payment ? fmt(m.last_payment) : 'never'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#2e2800', fontSize: 9, fontFamily: F, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{isOD ? 'Overdue' : 'Next due'}</div>
                  <div style={{ color: isOD ? ORG : m.status === 'active' ? GRN : '#444', fontSize: 14, fontWeight: 800, fontFamily: F, marginTop: 2 }}>
                    {isOD ? `${od2} days` : nx ? nx.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>
              {m.status !== 'active' && (
                <button onClick={() => markPaid(m.id)} disabled={saving === m.id}
                  style={{ marginTop: 12, width: '100%', padding: 10, background: 'transparent', border: '1px solid #2a5a2a', borderRadius: 3, color: GRN, fontSize: 12, fontWeight: 800, fontFamily: F, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer', opacity: saving === m.id ? .6 : 1 }}>
                  {saving === m.id ? 'Saving...' : 'Mark as Paid'}
                </button>
              )}
            </div>
          </Card>
        );
      })}
    </>
  );
}

// ---- SCHEDULE VIEW ----
function ScheduleView({ schedule, setSchedule }) {
  const [mode, setMode] = useState('week');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ day_of_week: 1, start_time: '18:30', class_name: '', type: 'Gi', instructor: '' });
  const [saving, setSaving] = useState(false);

  async function openEdit(c) {
    setModal(c ? c.id : 'new');
    setForm(c ? { day_of_week: c.day_of_week, start_time: c.start_time, class_name: c.class_name, type: c.type, instructor: c.instructor || '' } : { day_of_week: 1, start_time: '18:30', class_name: '', type: 'Gi', instructor: '' });
  }

  async function save() {
    if (!form.class_name.trim()) return;
    setSaving(true);
    if (modal === 'new') {
      const { data } = await supabase.from('schedule').insert({ ...form, day_of_week: +form.day_of_week, active: true }).select().single();
      if (data) setSchedule(s => [...s, data].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)));
    } else {
      await supabase.from('schedule').update({ ...form, day_of_week: +form.day_of_week }).eq('id', modal);
      setSchedule(s => s.map(c => c.id === modal ? { ...c, ...form, day_of_week: +form.day_of_week } : c));
    }
    setSaving(false); setModal(null);
  }

  async function del(id) {
    await supabase.from('schedule').update({ active: false }).eq('id', id);
    setSchedule(s => s.filter(c => c.id !== id));
  }

  const sorted = [...schedule].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 2, color: G, textTransform: 'uppercase', fontFamily: F }}>Class Schedule</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['week','list'].map(v => (
            <button key={v} onClick={() => setMode(v)} style={{ padding: '6px 14px', background: mode === v ? GK : 'transparent', border: `1px solid ${mode === v ? GD : BL}`, borderRadius: 3, color: mode === v ? G : '#555', fontSize: 11, fontWeight: 800, fontFamily: F, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer' }}>{v}</button>
          ))}
          <GBtn onClick={() => openEdit(null)} small>+ Class</GBtn>
        </div>
      </div>

      {mode === 'week' ? DAYS.map((day, di) => {
        const cls = schedule.filter(c => c.day_of_week === di).sort((a, b) => a.start_time.localeCompare(b.start_time));
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
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                        <button onClick={() => openEdit(c)} style={{ padding: '3px 10px', background: 'transparent', border: `1px solid ${BL}`, borderRadius: 3, color: '#555', fontSize: 10, fontFamily: F, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => del(c.id)} style={{ padding: '3px 10px', background: 'transparent', border: '1px solid #3a1000', borderRadius: 3, color: '#6a2a00', fontSize: 10, fontFamily: F, cursor: 'pointer' }}>Remove</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </Card>
        );
      }) : sorted.map(c => (
        <Card key={c.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', flexWrap: 'wrap' }}>
            <span style={{ color: GD, fontSize: 12, fontFamily: F, fontWeight: 700, width: 28, flexShrink: 0 }}>{DAYSS[c.day_of_week]?.toUpperCase()}</span>
            <span style={{ color: G, fontSize: 14, fontWeight: 800, fontFamily: F, flexShrink: 0 }}>{c.start_time.slice(0, 5)}</span>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: F }}>{c.class_name}</span>
            <TypePill type={c.type} />
            {c.instructor && <span style={{ color: '#444', fontSize: 12, fontFamily: FB }}>{c.instructor}</span>}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
              <button onClick={() => openEdit(c)} style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${BL}`, borderRadius: 3, color: '#555', fontSize: 10, fontFamily: F, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => del(c.id)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #3a1000', borderRadius: 3, color: '#6a2a00', fontSize: 10, fontFamily: F, cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </Card>
      ))}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'new' ? 'Add Class' : 'Edit Class'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><FieldLabel>Day</FieldLabel><FSelect value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: +e.target.value }))} options={DAYS.map((d, i) => ({ v: i, l: d }))} /></div>
            <div style={{ flex: 1 }}><FieldLabel>Time</FieldLabel><input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={{ width: '100%', background: '#111', border: `1px solid ${BL}`, borderRadius: 3, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: FB, colorScheme: 'dark', boxSizing: 'border-box' }} /></div>
          </div>
          <div><FieldLabel>Class Name</FieldLabel><FInput value={form.class_name} onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))} placeholder="e.g. Fundamentals" /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><FieldLabel>Type</FieldLabel><FSelect value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={TYPES} /></div>
            <div style={{ flex: 1 }}><FieldLabel>Instructor</FieldLabel><FInput value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Optional" /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <GhBtn onClick={() => setModal(null)} style={{ flex: 1 }}>Cancel</GhBtn>
            <GBtn onClick={save} style={{ flex: 2, opacity: saving ? .6 : 1 }}>{saving ? 'Saving...' : 'Save Class'}</GBtn>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ---- ANALYTICS VIEW ----
function AnalyticsView({ members }) {
  const total = members.length;
  const active = members.filter(m => m.status === 'active');
  const t60 = members.filter(m => m.last_trained && dAgo(m.last_trained) <= 60);
  const t30 = members.filter(m => m.last_trained && dAgo(m.last_trained) <= 30);
  const ret = t60.length > 0 ? Math.round((t30.length / t60.length) * 100) : 0;
  const newM = members.filter(m => dAgo(m.joined_at) <= 30).length;
  const churn = members.filter(m => m.status === 'inactive' && m.last_trained && dAgo(m.last_trained) >= 30 && dAgo(m.last_trained) <= 60).length;
  const top = [...members].sort((a, b) => (b.sessions || 0) - (a.sessions || 0)).slice(0, 5);
  const maxS = top[0]?.sessions || 1;
  const r = 40, circ = 2 * Math.PI * r, dash = circ * (ret / 100);
  const ringC = ret >= 70 ? GRN : ret >= 50 ? G : ORG;

  const cardStyle = { background: CARD, border: `1px solid ${BL}`, borderRadius: 5, padding: 20, marginBottom: 14 };

  return (
    <>
      <div style={cardStyle}>
        <SLabel>30-Day Active Retention</SLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
            <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r={r} fill="none" stroke="#161600" strokeWidth="8" />
              <circle cx="50" cy="50" r={r} fill="none" stroke={ringC} strokeWidth="8" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: G, fontFamily: F }}>{ret}%</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: F, lineHeight: 1.5 }}>{t30.length} of {t60.length} who trained in the last 60 days came back in the last 30.</div>
            <div style={{ color: '#3a3200', fontSize: 12, marginTop: 6, fontFamily: FB, lineHeight: 1.6 }}>Healthy BJJ gyms hold 60–75%+ on this metric.</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {[{ l: 'New This Month', v: `+${newM}`, c: GRN }, { l: 'Recent Dropoff', v: churn, c: churn > 0 ? ORG : GRN }, { l: 'Active Now', v: active.length, c: G }].map(x => (
                <div key={x.l} style={{ flex: 1, minWidth: 70, background: '#111', border: `1px solid ${BL}`, borderRadius: 4, padding: '12px 14px' }}>
                  <div style={{ color: '#2e2800', fontSize: 9, fontFamily: F, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>{x.l}</div>
                  <div style={{ color: x.c, fontSize: 22, fontWeight: 800, fontFamily: F, marginTop: 3 }}ly>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={cardStyle}>
          <SLabel>Top Trainers</SLabel>
          {top.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ color: '#1e1a00', fontWeight: 800, fontSize: 18, fontFamily: F, width: 18, textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: F, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                <div style={{ height: 3, background: '#161600', borderRadius: 1, marginTop: 5 }}><div style={{ height: 3, borderRadius: 1, background: G, width: `${((m.sessions || 0) / maxS) * 100}%` }} /></div>
              </div>
              <div style={{ color: G, fontWeight: 800, fontSize: 15, fontFamily: F, flexShrink: 0 }}>{m.sessions || 0}</div>
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <SLabel>Belt Breakdown</SLabel>
          {BELTS.map(b => { const cnt = members.filter(m => m.belt === b).length; if (!cnt) return null; const c = BELT_CFG[b]; return (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <BeltBadge belt={b} stripes={0} />
              <div style={{ flex: 1 }}><div style={{ height: 5, background: '#111', borderRadius: 2 }}><div style={{ height: 5, borderRadius: 2, background: c.bg === '#e8e8e0' ? '#d0d0c8' : c.bg, border: `1px solid ${c.br}`, width: `${(cnt / total) * 100}%` }} /></div></div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: F, width: 20, textAlign: 'right' }}>{cnt}</div>
            </div>
          );})}
        </div>
      </div>
    </>
  );
}

// ---- ROOT ADMIN APP ----
export default function AdminApp({ initialMembers, initialSchedule }) {
  const [members, setMembers] = useState(initialMembers);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [view, setView] = useState('roster');
  const [detailId, setDetailId] = useState(null);

  const stats = [
    { l: 'Active',   v: members.filter(m => m.status === 'active').length,   c: GRN },
    { l: 'Overdue',  v: members.filter(m => m.status === 'overdue').length,  c: ORG },
    { l: 'Inactive', v: members.filter(m => m.status === 'inactive').length, c: '#444' },
    { l: 'Sessions', v: members.reduce((a, m) => a + (m.sessions || 0), 0).toLocaleString(), c: G },
  ];

  const navs = [
    { id: 'roster',    l: 'Roster' },
    { id: 'payments',  l: 'Payments' },
    { id: 'schedule',  l: 'Schedule' },
    { id: 'analytics', l: 'Analytics' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: FB }}>
      {/* Gold top bar */}
      <div style={{ height: 3, background: G }} />

      {/* Header */}
      <div style={{ background: BG, borderBottom: `1px solid ${BL}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 58, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: G, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#000', fontFamily: F, letterSpacing: 1 }}>HH</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 3, color: G, textTransform: 'uppercase', fontFamily: F, lineHeight: 1 }}>High Hat</div>
            <div style={{ fontSize: 8, color: '#444', letterSpacing: 2, textTransform: 'uppercase', fontFamily: F }}>Admin Panel</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {navs.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{ padding: '7px 14px', background: view === n.id ? G : 'transparent', border: view === n.id ? 'none' : `1px solid ${BL}`, borderRadius: 3, color: view === n.id ? '#000' : '#555', fontSize: 11, fontWeight: 800, fontFamily: F, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer' }}>{n.l}</button>
          ))}
        </div>
        <GBtn onClick={() => view === 'schedule' ? null : null} small>{view === 'schedule' ? '+ Class' : '+ Member'}</GBtn>
      </div>

      {/* Stat bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BL}` }}>
        {stats.map((s, i) => (
          <div key={s.l} style={{ flex: 1, padding: '12px 18px', borderRight: i < 3 ? `1px solid ${BL}` : 'none' }}>
            <div style={{ color: '#2e2800', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, fontFamily: F }}>{s.l}</div>
            <div style={{ color: s.c, fontSize: 26, fontWeight: 800, fontFamily: F, letterSpacing: -.5, marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 24px' }}>
        {view === 'roster'    && <RosterView members={members} setMembers={setMembers} openDetail={setDetailId} />}
        {view === 'payments'  && <PaymentsView members={members} setMembers={setMembers} />}
        {view === 'schedule'  && <ScheduleView schedule={schedule} setSchedule={setSchedule} />}
        {view === 'analytics' && <AnalyticsView members={members} />}
      </div>

      {detailId && <DetailModal id={detailId} members={members} setMembers={setMembers} onClose={() => setDetailId(null)} />}
    </div>
  );
}
