'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const G='#c9a227',GD='#8a6e18',GK='#1a1600',BG='#060606',CARD='#0d0d0b',BL='#2e2600',GRN='#4a9e4a',ORG='#c97316';
const F="'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FB="'Barlow','Arial Narrow',Arial,sans-serif";
const BELT_CFG={White:{bg:'#e8e8e0',tx:'#111',br:'#bbb'},Blue:{bg:'#1a3a6e',tx:'#fff',br:'#2a5aae'},Purple:{bg:'#3e1460',tx:'#fff',br:'#6a2aaa'},Brown:{bg:'#4a2000',tx:'#fff',br:'#7a3e10'},Black:{bg:'#0a0a0a',tx:'#fff',br:'#3a3a3a'}};
const TYPE_CFG={'Gi':{bg:'#1a3a6e',br:'#2a5aae'},'No-Gi':{bg:'#4a1a1a',br:'#8a2a2a'},Wrestling:{bg:'#1a3a1a',br:'#2a6a2a'},Judo:{bg:'#3a1a00',br:'#7a4a00'},'Open Mat':{bg:'#1a1a3a',br:'#3a3a8a'},Other:{bg:'#222',br:'#444'}};
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYSS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const BELTS=['White','Blue','Purple','Brown','Black'];
const TYPES=['Gi','No-Gi','Wrestling','Judo','Open Mat','Other'];
const TODAY=new Date();
const ini=n=>n?n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2):'?';
const dAgo=d=>Math.floor((TODAY-new Date(d))/86400000);
const dOD=lp=>{const d=new Date(lp);d.setMonth(d.getMonth()+1);return Math.max(0,Math.floor((TODAY-d)/86400000))};
const nxPay=lp=>{const d=new Date(lp);d.setMonth(d.getMonth()+1);return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
const fmt=d=>new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const todayStr=()=>new Date().toISOString().split('T')[0];
const fmtPrice=c=>'$'+(c/100).toFixed(2);

function SLabel({ch}){return <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><div style={{width:12,height:1,background:G,opacity:.5}}/><span style={{color:GD,fontSize:9,fontWeight:800,letterSpacing:2,textTransform:'uppercase',fontFamily:F}}>{ch}</span><div style={{flex:1,height:1,background:BL}}/></div>}
function Card({ch,style={}}){return <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:5,marginBottom:8,overflow:'hidden',...style}}>{ch}</div>}
function GBtn({ch,onClick,style={},small,disabled}){return <button onClick={onClick} disabled={disabled} style={{padding:small?'6px 14px':'9px 18px',background:G,border:'none',borderRadius:3,color:'#000',fontWeight:800,fontSize:small?11:13,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',opacity:disabled?.5:1,...style}}>{ch}</button>}
function GhBtn({ch,onClick,style={}}){return <button onClick={onClick} style={{padding:'7px 14px',background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:'#555',fontSize:11,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',...style}}>{ch}</button>}
function DBtn({ch,onClick,style={},disabled}){return <button onClick={onClick} disabled={disabled} style={{padding:'7px 14px',background:'transparent',border:'1px solid #7a2020',borderRadius:3,color:'#c94040',fontSize:11,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',opacity:disabled?.5:1,...style}}>{ch}</button>}
function BB({belt,stripes,lg}){const c=BELT_CFG[belt]||BELT_CFG.White,sc=belt==='White'?'#111':'#fff';const h=lg?22:16,w=lg?90:64,sw=lg?6:4;return <div style={{display:'inline-flex',alignItems:'center',justifyContent:'space-between',background:c.bg,border:`1.5px solid ${c.br}`,borderRadius:2,width:w,height:h,padding:'0 4px',flexShrink:0,gap:2}}><span style={{fontSize:lg?9:7,fontWeight:800,fontFamily:F,color:c.tx,letterSpacing:1,textTransform:'uppercase'}}>{belt}</span><div style={{display:'flex',gap:2}}>{[0,1,2,3,4].map(i=><div key={i} style={{width:sw,height:h-4,borderRadius:1,background:i<stripes?sc:'transparent',border:`1px solid ${i<stripes?sc:(belt==='White'?'#aaa':c.br)}`,opacity:i<stripes?1:0.3}}/>)}</div></div>}
function SDot({status}){return <span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:{active:GRN,overdue:ORG,inactive:'#444'}[status]||'#444',flexShrink:0}}/>}
function TPill({type}){const c=TYPE_CFG[type]||TYPE_CFG.Other;return <span style={{padding:'2px 7px',background:c.bg,border:`1px solid ${c.br}`,borderRadius:2,fontSize:9,fontWeight:800,fontFamily:F,color:'#fff',letterSpacing:1,textTransform:'uppercase'}}>{type}</span>}
function FL({ch}){return <div style={{color:GD,fontSize:10,letterSpacing:1.5,textTransform:'uppercase',marginBottom:6,fontWeight:800,fontFamily:F}}>{ch}</div>}
const inp={width:'100%',background:'#111',border:`1px solid ${BL}`,borderRadius:3,padding:'10px 12px',color:'#fff',fontSize:14,outline:'none',fontFamily:FB,WebkitAppearance:'none',colorScheme:'dark',boxSizing:'border-box'};
function FI({value,onChange,placeholder,type='text'}){return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inp}/>}
function FS({value,onChange,options}){return <select value={value} onChange={onChange} style={inp}>{options.map(o=>typeof o==='object'?<option key={o.v} value={o.v}>{o.l}</option>:<option key={o}>{o}</option>)}</select>}
function Modal({open,onClose,title,ch,wide}){if(!open)return null;return <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.92)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}><div style={{background:'#0a0a0a',border:`1px solid ${BL}`,borderRadius:6,width:'100%',maxWidth:wide?480:420,maxHeight:'90vh',overflowY:'auto'}}><div style={{height:3,background:G,opacity:.85}}/><div style={{padding:24}}><div style={{fontWeight:800,fontSize:18,letterSpacing:2,color:'#fff',textTransform:'uppercase',marginBottom:20,fontFamily:F}}>{title}</div>{ch}</div></div></div>}

function Logo(){
  return <div style={{display:'flex',alignItems:'center',gap:10}}>
    <div style={{position:'relative',width:48,height:36,flexShrink:0}}>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',gap:2,paddingTop:2}}>
        {[0,1,2,3,4,5].map(i=><div key={i} style={{height:4,background:G,opacity:i%2===0?1:0.15,borderRadius:1}}/>)}
      </div>
      <div style={{position:'absolute',top:2,left:2,width:18,height:18,background:G,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:7,fontWeight:900,color:'#000',fontFamily:F,letterSpacing:0}}>★★</span>
      </div>
    </div>
    <div>
      <div style={{fontWeight:800,fontSize:16,letterSpacing:2,color:G,textTransform:'uppercase',fontFamily:F,lineHeight:1}}>High Hat</div>
      <div style={{fontSize:8,color:'#555',letterSpacing:1.5,textTransform:'uppercase',fontFamily:F,lineHeight:1.4}}>American Jiu Jitsu</div>
    </div>
  </div>;
}

function RosterView({members,setMembers,openDetail}){
  const [search,setSrch]=useState('');
  const [filter,setF]=useState('all');
  const [showAdd,setAdd]=useState(false);
  const [form,setForm]=useState({name:'',email:'',belt:'White',stripes:0});
  const [saving,setSv]=useState(false);
  const [err,setErr]=useState(null);
  const list=members.filter(m=>(filter==='all'||m.status===filter)&&(m.name||'').toLowerCase().includes(search.toLowerCase()));
  async function add(){
    if(!form.name.trim()||!form.email.trim())return setErr('Name and email required.');
    setSv(true);setErr(null);
    const{data,error}=await supabase.from('members').insert({name:form.name.trim(),email:form.email.trim(),belt:form.belt,stripes:+form.stripes,status:'active',joined_at:todayStr(),next_payment_date:todayStr()}).select().single();
    setSv(false);
    if(error){setErr(error.message);return;}
    setMembers(ms=>[...ms,data].sort((a,b)=>(a.name||'').localeCompare(b.name||'')));
    setAdd(false);setForm({name:'',email:'',belt:'White',stripes:0});
  }
  return <>
    <input value={search} onChange={e=>setSrch(e.target.value)} placeholder="Search members..." style={{...inp,marginBottom:12,background:CARD}}/>
    <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
      {['all','active','overdue','inactive'].map(f=><button key={f} onClick={()=>setF(f)} style={{padding:'6px 14px',background:filter===f?GK:'transparent',border:`1px solid ${filter===f?GD:BL}`,borderRadius:3,color:filter===f?G:'#555',fontSize:11,fontWeight:800,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer'}}>{f}</button>)}
      <GBtn ch="+ Member" onClick={()=>setAdd(true)} small style={{marginLeft:'auto'}}/>
    </div>
    {list.map(m=>{
      const sc=m.status==='overdue'?ORG:m.status==='active'?GRN:'#444';
      const od=m.status==='overdue'&&m.last_payment?dOD(m.last_payment):0;
      return <div key={m.id} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:5,marginBottom:8,overflow:'hidden'}}>
        <div onClick={()=>openDetail(m.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',cursor:'pointer'}}>
          <div style={{width:38,height:38,borderRadius:3,background:'#141400',border:`1.5px solid ${GD}`,display:'flex',alignItems:'center',justifyContent:'center',color:G,fontSize:13,fontWeight:800,fontFamily:F,flexShrink:0}}>{ini(m.name)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:'#fff',fontSize:14,fontWeight:700,fontFamily:F,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
            <div style={{marginTop:5}}><BB belt={m.belt||'White'} stripes={m.stripes||0}/></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}><SDot status={m.status}/><span style={{fontSize:12,color:sc,fontFamily:F,fontWeight:700}}>{m.status==='overdue'?`${od}d overdue`:m.status}</span></div>
        </div>
      </div>;
    })}
    {list.length===0&&<div style={{textAlign:'center',color:'#2a2a2a',padding:'48px 0',fontFamily:F}}>No members found</div>}
    <Modal open={showAdd} onClose={()=>setAdd(false)} title="Add Member" ch={
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {err&&<div style={{color:ORG,fontSize:13,fontFamily:FB}}>{err}</div>}
        <div><FL ch="Full Name"/><FI value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Marcus Tavares"/></div>
        <div><FL ch="Email"/><FI value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="member@example.com" type="email"/></div>
        <div style={{display:'flex',gap:12}}>
          <div style={{flex:1}}><FL ch="Belt"/><FS value={form.belt} onChange={e=>setForm(f=>({...f,belt:e.target.value}))} options={BELTS}/></div>
          <div style={{flex:1}}><FL ch="Stripes"/><FS value={form.stripes} onChange={e=>setForm(f=>({...f,stripes:+e.target.value}))} options={[0,1,2,3,4].map(n=>({v:n,l:n}))}/></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:4}}>
          <GhBtn ch="Cancel" onClick={()=>setAdd(false)} style={{flex:1}}/>
          <GBtn ch={saving?'Saving...':'Add Member'} onClick={add} style={{flex:2,opacity:saving?.6:1}} disabled={saving}/>
        </div>
      </div>
    }/>
  </>;
}

function DetailModal({id,members,setMembers,onClose}){
  const m=members.find(x=>x.id===id);
  const [belt,setBelt]=useState(m?.belt||'White');
  const [stripes,setStr]=useState(m?.stripes||0);
  const [sv,setSv]=useState(false);
  const [conf,setConf]=useState(false);
  const [cancelling,setCanc]=useState(false);
  if(!m)return null;
  const od=m.status==='overdue'&&m.last_payment?dOD(m.last_payment):0;
  async function saveBelt(){setSv(true);await supabase.from('members').update({belt,stripes}).eq('id',id);setMembers(ms=>ms.map(x=>x.id===id?{...x,belt,stripes}:x));setSv(false);}
  async function logSess(){setSv(true);const n=(m.sessions||0)+1;await supabase.from('members').update({sessions:n}).eq('id',id);await supabase.from('sessions').insert({member_id:id,session_date:todayStr()});setMembers(ms=>ms.map(x=>x.id===id?{...x,sessions:n}:x));setSv(false);}
  async function setStat(s){setSv(true);const u={status:s};if(s==='active')u.last_payment=todayStr();await supabase.from('members').update(u).eq('id',id);setMembers(ms=>ms.map(x=>x.id===id?{...x,...u}:x));setSv(false);onClose();}
  async function cancelSub(){
    if(!m.stripe_subscription_id){alert('No Stripe subscription ID on file.');return;}
    setCanc(true);
    const r=await fetch('/api/cancel-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscriptionId:m.stripe_subscription_id,memberId:id})});
    const d=await r.json();
    if(d.success){setMembers(ms=>ms.map(x=>x.id===id?{...x,status:'inactive',stripe_subscription_id:null}:x));onClose();}
    else alert('Error: '+d.error);
    setCanc(false);setConf(false);
  }
  return <Modal open title="Member" onClose={onClose} wide ch={<>
    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
      <div style={{width:48,height:48,borderRadius:3,background:'#141400',border:`2px solid ${G}`,display:'flex',alignItems:'center',justifyContent:'center',color:G,fontSize:16,fontWeight:800,fontFamily:F,flexShrink:0}}>{ini(m.name)}</div>
      <div><div style={{color:'#fff',fontSize:17,fontWeight:800,fontFamily:F}}>{m.name}</div><div style={{color:'#444',fontSize:12,fontFamily:FB,marginTop:1}}>{m.email}</div><div style={{marginTop:6}}><BB belt={m.belt||'White'} stripes={m.stripes||0} lg/></div></div>
    </div>
    {(m.phone||m.emergency_contact)&&<div style={{background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'10px 14px',marginBottom:12}}>
      {m.phone&&<div style={{color:'#888',fontSize:13,fontFamily:FB,marginBottom:3}}>📱 {m.phone}</div>}
      {m.emergency_contact&&<div style={{color:'#888',fontSize:13,fontFamily:FB}}>🚨 {m.emergency_contact}</div>}
    </div>}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
      {[{l:'Sessions',v:m.sessions||0},{l:'Status',v:m.status},{l:'Since',v:m.joined_at?new Date(m.joined_at).getFullYear():'—'}].map(x=><div key={x.l} style={{background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'10px',textAlign:'center'}}><div style={{color:'#2a2200',fontSize:9,textTransform:'uppercase',letterSpacing:1.5,fontWeight:800,fontFamily:F}}>{x.l}</div><div style={{color:'#fff',fontSize:18,fontWeight:800,fontFamily:F,marginTop:3}}>{x.v}</div></div>)}
    </div>
    {m.status==='overdue'&&<div style={{background:'#1a0800',border:'1px solid #7a3300',borderRadius:4,padding:'10px 14px',marginBottom:12,color:ORG,fontSize:13,fontFamily:FB}}>Payment {od} day{od!==1?'s':''} overdue</div>}
    <div style={{background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'14px 16px',marginBottom:12}}>
      <SLabel ch="Payment"/>
      <div style={{display:'flex',justifyContent:'space-between'}}>
        <div><div style={{color:'#444',fontSize:11,fontFamily:FB}}>Last paid</div><div style={{color:'#fff',fontSize:14,fontWeight:700,fontFamily:F,marginTop:2}}>{m.last_payment?fmt(m.last_payment):'—'}</div></div>
        <div style={{textAlign:'right'}}><div style={{color:'#444',fontSize:11,fontFamily:FB}}>Next due</div><div style={{color:m.status==='overdue'?ORG:GRN,fontSize:14,fontWeight:700,fontFamily:F,marginTop:2}}>{m.last_payment?nxPay(m.last_payment):'—'}</div></div>
      </div>
      {m.stripe_customer_id&&<a href={`https://dashboard.stripe.com/customers/${m.stripe_customer_id}`} target="_blank" rel="noreferrer" style={{display:'block',marginTop:10,textAlign:'center',padding:'8px',border:`1px solid ${BL}`,borderRadius:3,color:GD,fontSize:11,fontFamily:F,letterSpacing:1,textTransform:'uppercase',textDecoration:'none'}}>View in Stripe ↗</a>}
    </div>
    <div style={{background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'14px 16px',marginBottom:12}}>
      <SLabel ch="Update Belt"/>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{flex:1}}><FS value={belt} onChange={e=>setBelt(e.target.value)} options={BELTS}/></div>
        <div style={{width:78}}><FS value={stripes} onChange={e=>setStr(+e.target.value)} options={[0,1,2,3,4].map(n=>({v:n,l:n}))}/></div>
        <GBtn ch="Save" onClick={saveBelt} small disabled={sv}/>
      </div>
    </div>
    <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
      <button onClick={logSess} disabled={sv} style={{flex:'1 1 120px',padding:12,background:'#0a1a0a',border:`1px solid #2a5a2a`,borderRadius:4,color:GRN,fontSize:12,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>+ Session</button>
      {m.status!=='active'?<button onClick={()=>setStat('active')} disabled={sv} style={{flex:'1 1 120px',padding:12,background:'#0a1a0a',border:`1px solid #2a5a2a`,borderRadius:4,color:GRN,fontSize:12,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>Mark Active</button>
      :<button onClick={()=>setStat('inactive')} disabled={sv} style={{flex:'1 1 120px',padding:12,background:'#111',border:`1px solid ${BL}`,borderRadius:4,color:'#444',fontSize:12,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>Deactivate</button>}
    </div>
    {m.stripe_subscription_id&&!conf&&<DBtn ch="Cancel Subscription" onClick={()=>setConf(true)} style={{width:'100%',marginBottom:8}}/>}
    {conf&&<div style={{background:'#1a0808',border:'1px solid #7a2020',borderRadius:4,padding:'14px',marginBottom:8}}>
      <div style={{color:'#c94040',fontSize:13,fontFamily:FB,marginBottom:12}}>This cancels the Stripe subscription immediately. Cannot be undone.</div>
      <div style={{display:'flex',gap:8}}><GhBtn ch="Keep It" onClick={()=>setConf(false)} style={{flex:1}}/><DBtn ch={cancelling?'Cancelling...':'Yes, Cancel'} onClick={cancelSub} style={{flex:1}} disabled={cancelling}/></div>
    </div>}
    <GhBtn ch="Close" onClick={onClose} style={{width:'100%',textAlign:'center'}}/>
  </>}/>;
}

function PaymentsView({members,setMembers}){
  const sorted=[...members].sort((a,b)=>({overdue:0,active:1,inactive:2}[a.status]-{overdue:0,active:1,inactive:2}[b.status]));
  const od=members.filter(m=>m.status==='overdue').length;
  const [sv,setSv]=useState(null);
  async function markPaid(id){setSv(id);const lp=todayStr();const nx=new Date();nx.setMonth(nx.getMonth()+1);await supabase.from('members').update({status:'active',last_payment:lp,next_payment_date:nx.toISOString().split('T')[0]}).eq('id',id);setMembers(ms=>ms.map(m=>m.id===id?{...m,status:'active',last_payment:lp}:m));setSv(null);}
  return <>
    {od>0&&<div style={{background:'#120700',border:'1px solid #7a3300',borderRadius:4,padding:'14px 16px',marginBottom:14,color:ORG,fontSize:14,fontFamily:F,fontWeight:700}}>{od} member{od!==1?'s':''} with overdue payments</div>}
    {sorted.map(m=>{
      const isOD=m.status==='overdue';const od2=isOD&&m.last_payment?dOD(m.last_payment):0;
      const nx=m.last_payment?new Date(m.last_payment):null;if(nx)nx.setMonth(nx.getMonth()+1);
      return <div key={m.id} style={{background:isOD?'#0e0600':CARD,border:`1px solid ${isOD?'#3a1800':BL}`,borderRadius:5,marginBottom:8,overflow:'hidden'}}>
        <div style={{padding:'14px 16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:36,height:36,borderRadius:3,background:'#141400',border:`1.5px solid ${GD}`,display:'flex',alignItems:'center',justifyContent:'center',color:G,fontSize:12,fontWeight:800,fontFamily:F,flexShrink:0}}>{ini(m.name)}</div>
            <div style={{flex:1,minWidth:0}}><div style={{color:'#fff',fontSize:14,fontWeight:700,fontFamily:F,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div><div style={{color:'#333',fontSize:11,marginTop:2,fontFamily:F}}>Last paid {m.last_payment?fmt(m.last_payment):'never'}</div></div>
            <div style={{textAlign:'right',flexShrink:0}}><div style={{color:'#2e2800',fontSize:9,fontFamily:F,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>{isOD?'Overdue':'Next due'}</div><div style={{color:isOD?ORG:m.status==='active'?GRN:'#444',fontSize:14,fontWeight:800,fontFamily:F,marginTop:2}}>{isOD?`${od2} days`:nx?nx.toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—'}</div></div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:m.status!=='active'?12:8,flexWrap:'wrap'}}>
            {m.status!=='active'&&<button onClick={()=>markPaid(m.id)} disabled={sv===m.id} style={{flex:'1 1 120px',padding:'10px',background:'transparent',border:'1px solid #2a5a2a',borderRadius:3,color:GRN,fontSize:12,fontWeight:800,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',opacity:sv===m.id?.6:1}}>{sv===m.id?'Saving...':'Mark as Paid'}</button>}
            {m.stripe_customer_id&&<a href={`https://dashboard.stripe.com/customers/${m.stripe_customer_id}`} target="_blank" rel="noreferrer" style={{flex:'1 1 120px',padding:'10px',background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:GD,fontSize:12,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',textDecoration:'none',textAlign:'center'}}>Stripe ↗</a>}
          </div>
        </div>
      </div>;
    })}
  </>;
}

function ScheduleView({schedule,setSchedule}){
  const [mode,setMode]=useState('week');
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({day_of_week:1,start_time:'18:30',class_name:'',type:'Gi',instructor:''});
  const [sv,setSv]=useState(false);
  async function openEdit(c){setModal(c?c.id:'new');setForm(c?{day_of_week:c.day_of_week,start_time:c.start_time,class_name:c.class_name,type:c.type,instructor:c.instructor||''}:{day_of_week:1,start_time:'18:30',class_name:'',type:'Gi',instructor:''});}
  async function save(){if(!form.class_name.trim())return;setSv(true);if(modal==='new'){const{data}=await supabase.from('schedule').insert({...form,day_of_week:+form.day_of_week,active:true}).select().single();if(data)setSchedule(s=>[...s,data].sort((a,b)=>a.day_of_week-b.day_of_week||a.start_time.localeCompare(b.start_time)));}else{await supabase.from('schedule').update({...form,day_of_week:+form.day_of_week}).eq('id',modal);setSchedule(s=>s.map(c=>c.id===modal?{...c,...form,day_of_week:+form.day_of_week}:c));}setSv(false);setModal(null);}
  async function del(id){await supabase.from('schedule').update({active:false}).eq('id',id);setSchedule(s=>s.filter(c=>c.id!==id));}
  const sorted=[...schedule].sort((a,b)=>a.day_of_week-b.day_of_week||a.start_time.localeCompare(b.start_time));
  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,flexWrap:'wrap',gap:10}}>
      <div style={{fontWeight:800,fontSize:22,letterSpacing:2,color:G,textTransform:'uppercase',fontFamily:F}}>Class Schedule</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {['week','list'].map(v=><button key={v} onClick={()=>setMode(v)} style={{padding:'6px 14px',background:mode===v?GK:'transparent',border:`1px solid ${mode===v?GD:BL}`,borderRadius:3,color:mode===v?G:'#555',fontSize:11,fontWeight:800,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer'}}>{v}</button>)}
        <GBtn ch="+ Class" onClick={()=>openEdit(null)} small/>
      </div>
    </div>
    {mode==='week'?DAYS.map((day,di)=>{const cls=schedule.filter(c=>c.day_of_week===di).sort((a,b)=>a.start_time.localeCompare(b.start_time));return <div key={day} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:5,marginBottom:8,overflow:'hidden'}}><div style={{display:'flex',gap:14,padding:'14px 16px',alignItems:cls.length?'flex-start':'center'}}><div style={{width:44,height:44,borderRadius:3,background:cls.length?GK:'transparent',border:`1.5px solid ${cls.length?GD:BL}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:12,fontFamily:F,letterSpacing:1.5,color:cls.length?G:'#2a2a2a',flexShrink:0}}>{DAYSS[di].toUpperCase()}</div><div style={{flex:1,minWidth:0}}>{cls.length===0?<span style={{color:'#2a2a2a',fontSize:13,fontFamily:F}}>Rest Day</span>:cls.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8}}><span style={{color:G,fontSize:14,fontWeight:800,fontFamily:F,flexShrink:0}}>{c.start_time.slice(0,5)}</span><span style={{color:'#fff',fontSize:14,fontWeight:600,fontFamily:F}}>{c.class_name}</span><TPill type={c.type}/>{c.instructor&&<span style={{color:'#444',fontSize:12,fontFamily:FB}}>{c.instructor}</span>}<div style={{marginLeft:'auto',display:'flex',gap:5}}><button onClick={()=>openEdit(c)} style={{padding:'3px 10px',background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:'#555',fontSize:10,fontFamily:F,cursor:'pointer'}}>Edit</button><button onClick={()=>del(c.id)} style={{padding:'3px 10px',background:'transparent',border:'1px solid #3a1000',borderRadius:3,color:'#6a2a00',fontSize:10,fontFamily:F,cursor:'pointer'}}>Remove</button></div></div>)}</div></div></div>;}):sorted.map(c=><div key={c.id} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:5,marginBottom:6,overflow:'hidden'}}><div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',flexWrap:'wrap'}}><span style={{color:GD,fontSize:12,fontFamily:F,fontWeight:700,width:28,flexShrink:0}}>{DAYSS[c.day_of_week]?.toUpperCase()}</span><span style={{color:G,fontSize:14,fontWeight:800,fontFamily:F,flexShrink:0}}>{c.start_time.slice(0,5)}</span><span style={{color:'#fff',fontSize:14,fontWeight:600,fontFamily:F}}>{c.class_name}</span><TPill type={c.type}/>{c.instructor&&<span style={{color:'#444',fontSize:12,fontFamily:FB}}>{c.instructor}</span>}<div style={{marginLeft:'auto',display:'flex',gap:5}}><button onClick={()=>openEdit(c)} style={{padding:'4px 10px',background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:'#555',fontSize:10,fontFamily:F,cursor:'pointer'}}>Edit</button><button onClick={()=>del(c.id)} style={{padding:'4px 10px',background:'transparent',border:'1px solid #3a1000',borderRadius:3,color:'#6a2a00',fontSize:10,fontFamily:F,cursor:'pointer'}}>Remove</button></div></div></div>)}
    <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==='new'?'Add Class':'Edit Class'} ch={<div style={{display:'flex',flexDirection:'column',gap:14}}><div style={{display:'flex',gap:12}}><div style={{flex:1}}><FL ch="Day"/><FS value={form.day_of_week} onChange={e=>setForm(f=>({...f,day_of_week:+e.target.value}))} options={DAYS.map((d,i)=>({v:i,l:d}))}/></div><div style={{flex:1}}><FL ch="Time"/><input type="time" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))} style={{...inp}}/></div></div><div><FL ch="Class Name"/><FI value={form.class_name} onChange={e=>setForm(f=>({...f,class_name:e.target.value}))} placeholder="e.g. Fundamentals"/></div><div style={{display:'flex',gap:12}}><div style={{flex:1}}><FL ch="Type"/><FS value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} options={TYPES}/></div><div style={{flex:1}}><FL ch="Instructor"/><FI value={form.instructor} onChange={e=>setForm(f=>({...f,instructor:e.target.value}))} placeholder="Optional"/></div></div><div style={{display:'flex',gap:10,marginTop:4}}><GhBtn ch="Cancel" onClick={()=>setModal(null)} style={{flex:1}}/><GBtn ch={sv?'Saving...':'Save Class'} onClick={save} style={{flex:2,opacity:sv?.6:1}} disabled={sv}/></div></div>}/>
  </>;
}

function ProductsView({products,setProducts,members}){
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({name:'',description:'',price_cents:'',inventory:''});
  const [chargeModal,setChargeModal]=useState(null);
  const [chargeMem,setChargeMem]=useState('');
  const [sv,setSv]=useState(false);
  async function saveP(){if(!form.name.trim()||!form.price_cents)return;setSv(true);const p={name:form.name.trim(),description:form.description.trim(),price_cents:Math.round(parseFloat(form.price_cents)*100),inventory:form.inventory?parseInt(form.inventory):null,active:true};if(modal==='new'){const{data}=await supabase.from('products').insert(p).select().single();if(data)setProducts(ps=>[...ps,data]);}else{await supabase.from('products').update(p).eq('id',modal);setProducts(ps=>ps.map(x=>x.id===modal?{...x,...p}:x));}setSv(false);setModal(null);}
  async function archiveP(id){await supabase.from('products').update({active:false}).eq('id',id);setProducts(ps=>ps.filter(x=>x.id!==id));}
  function chargeViaStripe(){if(!chargeMem)return;const m=members.find(x=>x.id===chargeMem);if(!m?.stripe_customer_id){alert('No Stripe Customer ID for this member.');return;}window.open(`https://dashboard.stripe.com/customers/${m.stripe_customer_id}`,'_blank');setChargeModal(null);}
  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,flexWrap:'wrap',gap:10}}>
      <div style={{fontWeight:800,fontSize:22,letterSpacing:2,color:G,textTransform:'uppercase',fontFamily:F}}>Gear & Products</div>
      <GBtn ch="+ Product" onClick={()=>{setModal('new');setForm({name:'',description:'',price_cents:'',inventory:''}); }} small/>
    </div>
    {products.length===0&&<div style={{textAlign:'center',color:'#2a2a2a',padding:'48px 0',fontFamily:F}}>No products yet.</div>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
      {products.map(p=><div key={p.id} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:5,padding:16}}>
        <div style={{color:'#fff',fontSize:15,fontWeight:800,fontFamily:F,marginBottom:4}}>{p.name}</div>
        {p.description&&<div style={{color:'#555',fontSize:12,fontFamily:FB,marginBottom:10}}>{p.description}</div>}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{color:G,fontSize:22,fontWeight:800,fontFamily:F}}>{fmtPrice(p.price_cents)}</div>
          <div style={{color:'#444',fontSize:11,fontFamily:F}}>{p.inventory!=null?`${p.inventory} in stock`:'Unlimited'}</div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <GBtn ch="Charge" onClick={()=>{setChargeModal(p);setChargeMem('');}} small style={{flex:1}}/>
          <button onClick={()=>{setModal(p.id);setForm({name:p.name,description:p.description||'',price_cents:(p.price_cents/100).toFixed(2),inventory:p.inventory??''}); }} style={{padding:'6px 10px',background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:'#555',fontSize:10,fontFamily:F,cursor:'pointer'}}>Edit</button>
          <button onClick={()=>archiveP(p.id)} style={{padding:'6px 10px',background:'transparent',border:'1px solid #3a1000',borderRadius:3,color:'#6a2a00',fontSize:10,fontFamily:F,cursor:'pointer'}}>×</button>
        </div>
      </div>)}
    </div>
    <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==='new'?'Add Product':'Edit Product'} ch={<div style={{display:'flex',flexDirection:'column',gap:14}}><div><FL ch="Name"/><FI value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. High Hat Rashguard"/></div><div><FL ch="Description (optional)"/><FI value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Short description"/></div><div style={{display:'flex',gap:12}}><div style={{flex:1}}><FL ch="Price ($)"/><FI value={form.price_cents} onChange={e=>setForm(f=>({...f,price_cents:e.target.value}))} placeholder="35.00" type="number"/></div><div style={{flex:1}}><FL ch="Inventory (blank=unlimited)"/><FI value={form.inventory} onChange={e=>setForm(f=>({...f,inventory:e.target.value}))} placeholder="10" type="number"/></div></div><div style={{display:'flex',gap:10,marginTop:4}}><GhBtn ch="Cancel" onClick={()=>setModal(null)} style={{flex:1}}/><GBtn ch={sv?'Saving...':'Save Product'} onClick={saveP} style={{flex:2,opacity:sv?.6:1}} disabled={sv}/></div></div>}/>
    <Modal open={chargeModal!==null} onClose={()=>setChargeModal(null)} title="Charge Member" ch={chargeModal&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'12px 14px'}}><div style={{color:'#fff',fontSize:16,fontWeight:800,fontFamily:F}}>{chargeModal.name}</div><div style={{color:G,fontSize:20,fontWeight:800,fontFamily:F,marginTop:4}}>{fmtPrice(chargeModal.price_cents)}</div></div>
      <div><FL ch="Select Member"/><FS value={chargeMem} onChange={e=>setChargeMem(e.target.value)} options={[{v:'',l:'— Choose member —'},...members.filter(m=>m.stripe_customer_id).map(m=>({v:m.id,l:m.name}))]}/></div>
      <div style={{background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'12px 14px',color:'#555',fontSize:12,fontFamily:FB,lineHeight:1.6}}>Opens the member's Stripe page to create a one-time invoice.</div>
      <div style={{display:'flex',gap:10}}><GhBtn ch="Cancel" onClick={()=>setChargeModal(null)} style={{flex:1}}/><GBtn ch="Open in Stripe ↗" onClick={chargeViaStripe} style={{flex:2}} disabled={!chargeMem}/></div>
    </div>}/>
  </>;
}

function AnalyticsView({members}){
  const total=members.length;
  const active=members.filter(m=>m.status==='active');
  const t60=members.filter(m=>m.last_trained&&dAgo(m.last_trained)<=60);
  const t30=members.filter(m=>m.last_trained&&dAgo(m.last_trained)<=30);
  const ret=t60.length?Math.round((t30.length/t60.length)*100):0;
  const newM=members.filter(m=>dAgo(m.joined_at)<=30).length;
  const churn=members.filter(m=>m.status==='inactive'&&m.last_trained&&dAgo(m.last_trained)>=30&&dAgo(m.last_trained)<=60).length;
  const top=[...members].sort((a,b)=>(b.sessions||0)-(a.sessions||0)).slice(0,5);
  const maxS=top[0]?.sessions||1;
  const r=40,circ=2*Math.PI*r,dash=circ*(ret/100),ringC=ret>=70?GRN:ret>=50?G:ORG;
  const cs={background:CARD,border:`1px solid ${BL}`,borderRadius:5,padding:20,marginBottom:14};
  return <>
    <div style={cs}><SLabel ch="30-Day Active Retention"/><div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}><div style={{position:'relative',width:90,height:90,flexShrink:0}}><svg width="90" height="90" viewBox="0 0 100 100" style={{transform:'rotate(-90deg)'}}><circle cx="50" cy="50" r={r} fill="none" stroke="#161600" strokeWidth="8"/><circle cx="50" cy="50" r={r} fill="none" stroke={ringC} strokeWidth="8" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/></svg><div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:20,color:G,fontFamily:F}}>{ret}%</div></div><div style={{flex:1}}><div style={{color:'#fff',fontSize:14,fontWeight:700,fontFamily:F,lineHeight:1.5}}>{t30.length} of {t60.length} who trained in last 60 days came back in last 30.</div><div style={{color:'#3a3200',fontSize:12,marginTop:6,fontFamily:FB,lineHeight:1.6}}>Healthy BJJ gyms hold 60–75%+ on this metric.</div><div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap'}}>{[{l:'New This Month',v:`+${newM}`,c:GRN},{l:'Recent Dropoff',v:churn,c:churn?ORG:GRN},{l:'Active Now',v:active.length,c:G}].map(x=><div key={x.l} style={{flex:'1 1 70px',background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'12px 14px'}}><div style={{color:'#2e2800',fontSize:9,fontFamily:F,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase'}}>{x.l}</div><div style={{color:x.c,fontSize:22,fontWeight:800,fontFamily:F,marginTop:3}}>{x.v}</div></div>)}</div></div></div></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
      <div style={cs}><SLabel ch="Top Trainers"/>{top.map((m,i)=><div key={m.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}><div style={{color:'#1e1a00',fontWeight:800,fontSize:18,fontFamily:F,width:18,textAlign:'center',flexShrink:0}}>{i+1}</div><div style={{flex:1,minWidth:0}}><div style={{color:'#fff',fontSize:13,fontWeight:700,fontFamily:F,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div><div style={{height:3,background:'#161600',borderRadius:1,marginTop:5}}><div style={{height:3,borderRadius:1,background:G,width:`${((m.sessions||0)/maxS)*100}%`}}/></div></div><div style={{color:G,fontWeight:800,fontSize:15,fontFamily:F,flexShrink:0}}>{m.sessions||0}</div></div>)}</div>
      <div style={cs}><SLabel ch="Belt Breakdown"/>{BELTS.map(b=>{const cnt=members.filter(m=>m.belt===b).length;if(!cnt)return null;const c=BELT_CFG[b];return <div key={b} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}><BB belt={b} stripes={0}/><div style={{flex:1}}><div style={{height:5,background:'#111',borderRadius:2}}><div style={{height:5,borderRadius:2,background:c.bg==='#e8e8e0'?'#d0d0c8':c.bg,border:`1px solid ${c.br}`,width:`${(cnt/total)*100}%`}}/></div></div><div style={{color:'#fff',fontWeight:800,fontSize:15,fontFamily:F,width:20,textAlign:'right'}}>{cnt}</div></div>;})}</div>
    </div>
  </>;
}

export default function AdminApp({initialMembers,initialSchedule,initialProducts}){
  const [members,setMembers]=useState(initialMembers);
  const [schedule,setSchedule]=useState(initialSchedule);
  const [products,setProducts]=useState(initialProducts||[]);
  const [view,setView]=useState('roster');
  const [detailId,setDetailId]=useState(null);
  const navs=[{id:'roster',l:'Roster'},{id:'payments',l:'Payments'},{id:'schedule',l:'Schedule'},{id:'products',l:'Gear'},{id:'analytics',l:'Analytics'}];
  const stats=[{l:'Active',v:members.filter(m=>m.status==='active').length,c:GRN},{l:'Overdue',v:members.filter(m=>m.status==='overdue').length,c:ORG},{l:'Inactive',v:members.filter(m=>m.status==='inactive').length,c:'#444'},{l:'Sessions',v:members.reduce((a,m)=>a+(m.sessions||0),0).toLocaleString(),c:G}];
  return <div style={{minHeight:'100vh',background:BG,color:'#fff',fontFamily:FB}}>
    <div style={{height:3,background:G}}/>
    <div style={{background:BG,borderBottom:`1px solid ${BL}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',height:58,position:'sticky',top:0,zIndex:40,flexWrap:'wrap',gap:8}}>
      <Logo/>
      <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>{navs.map(n=><button key={n.id} onClick={()=>setView(n.id)} style={{padding:'6px 10px',background:view===n.id?G:'transparent',border:view===n.id?'none':`1px solid ${BL}`,borderRadius:3,color:view===n.id?'#000':'#555',fontSize:10,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>{n.l}</button>)}</div>
      <div style={{fontSize:9,color:'#444',fontFamily:F,letterSpacing:1,textTransform:'uppercase'}}>Admin</div>
    </div>
    <div style={{display:'flex',borderBottom:`1px solid ${BL}`,overflowX:'auto'}}>{stats.map((s,i)=><div key={s.l} style={{flex:'1 0 70px',padding:'10px 14px',borderRight:i<3?`1px solid ${BL}`:'none'}}><div style={{color:'#2e2800',fontSize:9,textTransform:'uppercase',letterSpacing:1.5,fontWeight:800,fontFamily:F}}>{s.l}</div><div style={{color:s.c,fontSize:22,fontWeight:800,fontFamily:F,letterSpacing:-.5,marginTop:2}}>{s.v}</div></div>)}</div>
    <div style={{padding:'16px'}}>
      {view==='roster'&&<RosterView members={members} setMembers={setMembers} openDetail={setDetailId}/>}
      {view==='payments'&&<PaymentsView members={members} setMembers={setMembers}/>}
      {view==='schedule'&&<ScheduleView schedule={schedule} setSchedule={setSchedule}/>}
      {view==='products'&&<ProductsView products={products} setProducts={setProducts} members={members}/>}
      {view==='analytics'&&<AnalyticsView members={members}/>}
    </div>
    {detailId&&<DetailModal id={detailId} members={members} setMembers={setMembers} onClose={()=>setDetailId(null)}/>}
  </div>;
}
