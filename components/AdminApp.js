'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ---- Design tokens -- Strava-inspired, High Hat black/gold ----
const G='#c9a227',GD='#8a6e18',GK='#1a1400';
const BG='#080808',SURF='#111109',CARD='#161610',BL='#242200';
const GRN='#3dba6b',ORG='#e06c1a',RED='#c94040',BLUE='#3a7abd';
const F="'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FB="'Barlow',Arial,sans-serif";
const FN="'Barlow Condensed','Arial Narrow',Arial,sans-serif"; // numerics

const BELT_CFG={
  White:{bg:'#e8e8e0',tx:'#111',br:'#ccc'},
  Grey:{bg:'#777',tx:'#fff',br:'#999'},
  Yellow:{bg:'#c9a227',tx:'#000',br:'#a07800'},
  Orange:{bg:'#c97316',tx:'#fff',br:'#a05010'},
  Green:{bg:'#2a6a2a',tx:'#fff',br:'#1a4a1a'},
  Blue:{bg:'#1a3a6e',tx:'#fff',br:'#2a5aae'},
  Purple:{bg:'#3e1460',tx:'#fff',br:'#6a2aaa'},
  Brown:{bg:'#4a2000',tx:'#fff',br:'#7a3e10'},
  Black:{bg:'#111',tx:'#fff',br:'#444'},
};
const TYPE_CFG={
  'Gi':{bg:'#0e2040',br:'#1a4080',tx:'#5a9aff'},
  'No-Gi':{bg:'#2a0e0e',br:'#6a2020',tx:'#ff7a7a'},
  'Wrestling':{bg:'#0e2a0e',br:'#206a20',tx:'#7acc7a'},
  'Judo':{bg:'#2a1a00',br:'#7a5000',tx:'#ffaa44'},
  'Open Mat':{bg:'#1a1a2a',br:'#4a4a9a',tx:'#aaaaff'},
  'Other':{bg:'#1a1a1a',br:'#444',tx:'#888'},
};
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYSS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const BELTS=['White','Grey','Yellow','Orange','Green','Blue','Purple','Brown','Black'];
const KIDS_BELTS=['White','Grey','Yellow','Orange','Green'];
const ADULT_BELTS=['White','Blue','Purple','Brown','Black'];
const TYPES=['Gi','No-Gi','Wrestling','Judo','Open Mat','Other'];
const TODAY=new Date();
const isKidsBelt=b=>['Grey','Yellow','Orange','Green'].includes(b);
const ini=n=>n?n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2):'?';
const dOD=lp=>{const d=new Date(lp);d.setMonth(d.getMonth()+1);return Math.max(0,Math.floor((TODAY-d)/86400000))};
const nxPay=lp=>{const d=new Date(lp);d.setMonth(d.getMonth()+1);return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
const fmt=d=>new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const todayStr=()=>new Date().toISOString().split('T')[0];
const fmtPrice=c=>'$'+(c/100).toFixed(2);

// ---- Shared UI ----
const inpStyle={width:'100%',background:SURF,border:`1px solid ${BL}`,borderRadius:6,padding:'13px 16px',color:'#fff',fontSize:16,outline:'none',fontFamily:FB,WebkitAppearance:'none',colorScheme:'dark',boxSizing:'border-box'};

function SLabel({ch}){
  return <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
    <div style={{width:3,height:14,background:G,borderRadius:2,flexShrink:0}}/>
    <span style={{color:G,fontSize:11,fontWeight:800,letterSpacing:2.5,textTransform:'uppercase',fontFamily:F}}>{ch}</span>
    <div style={{flex:1,height:1,background:BL}}/>
  </div>;
}
function Card({ch,style={}}){return <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,marginBottom:10,overflow:'hidden',...style}}>{ch}</div>}
function GBtn({ch,onClick,style={},sm,disabled}){return <button onClick={onClick} disabled={disabled} style={{padding:sm?'8px 16px':'11px 22px',background:G,border:'none',borderRadius:6,color:'#000',fontWeight:800,fontSize:sm?12:14,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',opacity:disabled?.5:1,...style}}>{ch}</button>}
function GhBtn({ch,onClick,style={}}){return <button onClick={onClick} style={{padding:'9px 16px',background:'transparent',border:`1px solid ${BL}`,borderRadius:6,color:'#777',fontSize:12,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',...style}}>{ch}</button>}
function DBtn({ch,onClick,disabled,style={}}){return <button onClick={onClick} disabled={disabled} style={{padding:'9px 16px',background:'transparent',border:'1px solid #6a2020',borderRadius:6,color:RED,fontSize:12,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',opacity:disabled?.5:1,...style}}>{ch}</button>}
function BB({belt,stripes,lg}){
  const c=BELT_CFG[belt]||BELT_CFG.White,sc=belt==='White'?'#111':'#fff';
  const kids=isKidsBelt(belt);
  const h=lg?24:17,w=kids?(lg?72:52):(lg?94:66),sw=lg?7:4;
  return <div style={{display:'inline-flex',alignItems:'center',justifyContent:kids?'center':'space-between',background:c.bg,border:`1.5px solid ${c.br}`,borderRadius:3,width:w,height:h,padding:'0 6px',flexShrink:0,gap:2}}>
    <span style={{fontSize:lg?10:7,fontWeight:800,fontFamily:F,color:c.tx,letterSpacing:1,textTransform:'uppercase'}}>{belt}</span>
    {!kids&&<div style={{display:'flex',gap:2}}>{[0,1,2,3,4].map(i=><div key={i} style={{width:sw,height:h-4,borderRadius:1,background:i<stripes?sc:'transparent',border:`1px solid ${i<stripes?sc:(belt==='White'?'#aaa':c.br)}`,opacity:i<stripes?1:0.25}}/>)}</div>}
  </div>;
}
function SDot({status}){
  const colors={active:GRN,overdue:ORG,pending:BLUE,inactive:'#444'};
  return <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:colors[status]||'#444',flexShrink:0,boxShadow:status==='active'?`0 0 6px ${GRN}40`:status==='overdue'?`0 0 6px ${ORG}40`:'none'}}/>;
}
function TPill({type}){
  const c=TYPE_CFG[type]||TYPE_CFG.Other;
  return <span style={{padding:'3px 8px',background:c.bg,border:`1px solid ${c.br}`,borderRadius:4,fontSize:10,fontWeight:800,fontFamily:F,color:c.tx,letterSpacing:1,textTransform:'uppercase'}}>{type}</span>;
}
function FL({ch}){return <div style={{color:GD,fontSize:11,letterSpacing:1.5,textTransform:'uppercase',marginBottom:8,fontWeight:800,fontFamily:F}}>{ch}</div>}
function FI({value,onChange,placeholder,type='text'}){return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inpStyle}/>}
function FS({value,onChange,options}){return <select value={value} onChange={onChange} style={inpStyle}>{options.map(o=>typeof o==='object'?<option key={o.v} value={o.v}>{o.l}</option>:<option key={o}>{o}</option>)}</select>}
function Modal({open,onClose,title,ch,wide}){
  if(!open)return null;
  return <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0'}}>
    <div style={{background:'#0e0e0c',border:`1px solid ${BL}`,borderRadius:'16px 16px 0 0',width:'100%',maxWidth:520,maxHeight:'92vh',overflowY:'auto'}}>
      <div style={{width:40,height:4,background:'#333',borderRadius:2,margin:'12px auto 0'}}/>
      <div style={{padding:'20px 24px 32px'}}>
        <div style={{fontWeight:800,fontSize:20,letterSpacing:1,color:'#fff',textTransform:'uppercase',marginBottom:20,fontFamily:F}}>{title}</div>
        {ch}
      </div>
    </div>
  </div>;
}

function Logo(){
  return <div style={{display:'flex',alignItems:'center',gap:10}}>
    <img src="/logo.png" alt="High Hat BJJ" style={{height:36,width:'auto',objectFit:'contain'}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/>
    <div style={{display:'none',width:36,height:36,background:G,borderRadius:4,alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:15,color:'#000',fontFamily:F,letterSpacing:1}}>HH</div>
    <div>
      <div style={{fontWeight:800,fontSize:15,letterSpacing:2.5,color:G,textTransform:'uppercase',fontFamily:F,lineHeight:1}}>High Hat</div>
      <div style={{fontSize:9,color:'#555',letterSpacing:2,textTransform:'uppercase',fontFamily:F}}>American Jiu Jitsu</div>
    </div>
  </div>;
}

function StatBar({stats,onSessionsClick}){
  return <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:`1px solid ${BL}`,background:SURF}}>
    {stats.map((s,i)=>{
      const isSession=s.l==='Sessions';
      return <div key={s.l} onClick={isSession?onSessionsClick:undefined} style={{padding:'14px 12px',borderRight:i<3?`1px solid ${BL}`:'none',textAlign:'center',cursor:isSession?'pointer':'default',background:isSession?'transparent':undefined}}>
        <div style={{color:s.c,fontSize:28,fontWeight:900,fontFamily:FN,lineHeight:1,letterSpacing:-1}}>{s.v}</div>
        <div style={{color:'#444',fontSize:10,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F,marginTop:4}}>{s.l}</div>
        {isSession&&<div style={{color:GD,fontSize:9,fontFamily:F,letterSpacing:1,textTransform:'uppercase',marginTop:2}}>View All</div>}
      </div>;
    })}
  </div>;
}

// ---- ROSTER ----
function RosterView({members,setMembers,openDetail}){
  const [srch,setSrch]=useState('');
  const [filt,setFilt]=useState('all');
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:'',email:'',belt:'White',stripes:0});
  const [sv,setSv]=useState(false);
  const [err,setErr]=useState(null);
  const list=members.filter(m=>(filt==='all'||m.status===filt)&&(m.name||'').toLowerCase().includes(srch.toLowerCase()));
  async function add(){
    if(!form.name.trim()||!form.email.trim())return setErr('Name and email required.');
    setSv(true);setErr(null);
    const{data,error}=await supabase.from('members').insert({name:form.name.trim(),email:form.email.trim(),belt:form.belt,stripes:isKidsBelt(form.belt)?0:+form.stripes,status:'active',joined_at:todayStr(),next_payment_date:todayStr()}).select().single();
    setSv(false);
    if(error){setErr(error.message);return;}
    setMembers(ms=>[...ms,data].sort((a,b)=>(a.name||'').localeCompare(b.name||'')));
    setShowAdd(false);setForm({name:'',email:'',belt:'White',stripes:0});
  }
  const statusColors={active:GRN,overdue:ORG,pending:BLUE,inactive:'#444'};
  return <>
    <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search members..." style={{...inpStyle,marginBottom:12,background:SURF}}/>
    <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      {['all','pending','active','overdue','inactive'].map(f=><button key={f} onClick={()=>setFilt(f)} style={{padding:'7px 14px',background:filt===f?GK:'transparent',border:`1px solid ${filt===f?G:BL}`,borderRadius:20,color:filt===f?G:'#555',fontSize:11,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>{f}</button>)}
      <GBtn ch="+ Member" onClick={()=>setShowAdd(true)} sm style={{marginLeft:'auto'}}/>
    </div>
    {list.map(m=>{
      const sc=statusColors[m.status]||'#444';
      const od=m.status==='overdue'&&m.last_payment?dOD(m.last_payment):0;
      return <div key={m.id} onClick={()=>openDetail(m.id)} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,marginBottom:8,overflow:'hidden',cursor:'pointer',display:'flex',alignItems:'center',gap:14,padding:'14px 18px'}}>
        <div style={{width:44,height:44,borderRadius:8,background:GK,border:`2px solid ${GD}`,display:'flex',alignItems:'center',justifyContent:'center',color:G,fontSize:14,fontWeight:800,fontFamily:F,flexShrink:0}}>{ini(m.name)}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:'#fff',fontSize:17,fontWeight:700,fontFamily:FB,letterSpacing:.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
          <div style={{marginTop:5}}><BB belt={m.belt||'White'} stripes={m.stripes||0}/></div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:5}}><SDot status={m.status}/><span style={{fontSize:12,color:sc,fontFamily:F,fontWeight:800,letterSpacing:.5}}>{m.status==='overdue'?`${od}d late`:m.status}</span></div>
          <div style={{color:'#333',fontSize:12,fontFamily:F}}>{m.sessions||0} sessions</div>
        </div>
        <div style={{color:'#333',fontSize:18}}>›</div>
      </div>;
    })}
    {list.length===0&&<div style={{textAlign:'center',color:'#333',padding:'60px 0',fontFamily:F,fontSize:15}}>No members found</div>}
    <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add Member" ch={
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {err&&<div style={{color:ORG,fontSize:14,fontFamily:FB,background:'#1a0800',padding:'10px 14px',borderRadius:6}}>{err}</div>}
        <div><FL ch="Full Name"/><FI value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Marcus Tavares"/></div>
        <div><FL ch="Email"/><FI value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="member@example.com" type="email"/></div>
        <div style={{display:'flex',gap:12}}>
          <div style={{flex:1}}><FL ch="Belt"/><FS value={form.belt} onChange={e=>setForm(f=>({...f,belt:e.target.value,stripes:isKidsBelt(e.target.value)?0:f.stripes}))} options={BELTS}/></div>
          {!isKidsBelt(form.belt)&&<div style={{flex:1}}><FL ch="Stripes"/><FS value={form.stripes} onChange={e=>setForm(f=>({...f,stripes:+e.target.value}))} options={[0,1,2,3,4].map(n=>({v:n,l:n}))}/></div>}
        </div>
        <div style={{display:'flex',gap:10,marginTop:4}}>
          <GhBtn ch="Cancel" onClick={()=>setShowAdd(false)} style={{flex:1}}/>
          <GBtn ch={sv?'Saving...':'Add Member'} onClick={add} style={{flex:2,opacity:sv?.6:1}} disabled={sv}/>
        </div>
      </div>
    }/>
  </>;
}

// ---- DETAIL MODAL ----
function DetailModal({id,members,setMembers,onClose}){
  const m=members.find(x=>x.id===id);
  const [belt,setBelt]=useState(m?.belt||'White');
  const [stripes,setStr]=useState(m?.stripes||0);
  const [sv,setSv]=useState(false);
  const [conf,setConf]=useState(false);
  const [cancelling,setCanc]=useState(false);
  const [showPayLink,setShowPayLink]=useState(false);
  const [payAmount,setPayAmount]=useState('');
  const [generatedLink,setGeneratedLink]=useState(null);
  const [genLoading,setGenLoading]=useState(false);
  const [showLink,setShowLink]=useState(false);
  const [showLogSession,setShowLogSession]=useState(false);
  const [showSessionLog,setShowSessionLog]=useState(false);
  const [sessionLog,setSessionLog]=useState([]);
  const [sessionLogLoading,setSessionLogLoading]=useState(false);
  const [confirmDelSession,setConfirmDelSession]=useState(null);

  async function loadSessionLog(){
    setSessionLogLoading(true);
    const{data}=await supabase.from('sessions').select('*').eq('member_id',id).order('session_date',{ascending:false});
    setSessionLog(data||[]);
    setSessionLogLoading(false);
    setShowSessionLog(true);
  }
  async function deleteSession(sessionId){
    await supabase.from('sessions').delete().eq('id',sessionId);
    // Decrement count
    const newCount=Math.max(0,(m.sessions||0)-1);
    await supabase.from('members').update({sessions:newCount}).eq('id',id);
    setMembers(ms=>ms.map(x=>x.id===id?{...x,sessions:newCount}:x));
    setSessionLog(sl=>sl.filter(s=>s.id!==sessionId));
    setConfirmDelSession(null);
  }
  const [logSessionDate,setLogSessionDate]=useState('');
  const [showEditInfo,setShowEditInfo]=useState(false);
  const [editName,setEditName]=useState(m?.name||'');
  const [editPhone,setEditPhone]=useState(m?.phone||'');
  const [editDOB,setEditDOB]=useState(m?.date_of_birth||'');
  const [pwResetSent,setPwResetSent]=useState(false);
  const [uploading,setUploading]=useState(false);

  async function saveInfo(){
    setSv(true);
    await supabase.from('members').update({name:editName,phone:editPhone,date_of_birth:editDOB||null}).eq('id',id);
    setMembers(ms=>ms.map(x=>x.id===id?{...x,name:editName,phone:editPhone,date_of_birth:editDOB||null}:x));
    setSv(false);setShowEditInfo(false);
  }
  async function sendPasswordReset(){
    if(!m.email)return;
    await supabase.auth.resetPasswordForEmail(m.email,{redirectTo:'https://high-hat-ajj.vercel.app/reset-password'});
    setPwResetSent(true);setTimeout(()=>setPwResetSent(false),4000);
  }
  async function uploadAvatar(file){
    if(!file)return;
    setUploading(true);
    const ext=file.name.split('.').pop();
    const path=`${id}/avatar.${ext}`;
    const{error:upErr}=await supabase.storage.from('avatars').upload(path,file,{upsert:true});
    if(!upErr){
      const{data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('members').update({avatar_url:publicUrl}).eq('id',id);
      setMembers(ms=>ms.map(x=>x.id===id?{...x,avatar_url:publicUrl}:x));
    }
    setUploading(false);
  }
  const [selectedPrimary,setSelectedPrimary]=useState(m?.primary_member_id||'');
  if(!m)return null;
  const od=m.status==='overdue'&&m.last_payment?dOD(m.last_payment):0;
  const isPrimary=!m?.primary_member_id;
  const primaryMember=m?.primary_member_id?members.find(x=>x.id===m.primary_member_id):null;
  const dependents=members.filter(x=>x.primary_member_id===id);

  async function saveBelt(){
    setSv(true);
    const ob=m.belt,os=m.stripes||0;
    await supabase.from('members').update({belt,stripes:isKidsBelt(belt)?0:stripes}).eq('id',id);
    if(belt!==ob||(isKidsBelt(belt)?0:stripes)!==os){
      await supabase.from('promotions').insert({member_id:id,member_name:m.name,old_belt:ob,old_stripes:os,new_belt:belt,new_stripes:isKidsBelt(belt)?0:stripes,promoted_by:'admin'});
    }
    setMembers(ms=>ms.map(x=>x.id===id?{...x,belt,stripes:isKidsBelt(belt)?0:stripes}:x));
    setSv(false);
  }
  function openLogSession(){
    setLogSessionDate(todayStr());
    setShowLogSession(true);
  }
  async function confirmLogSession(){
    setSv(true);
    const res=await fetch('/api/log-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({memberId:id,sessionDate:logSessionDate})});
    const data=await res.json();
    if(res.status===409){alert('A session is already logged for that date.');setSv(false);return;}
    if(data.session){
      // Increment count locally
      const n=(m.sessions||0)+1;
      setMembers(ms=>ms.map(x=>x.id===id?{...x,sessions:n}:x));
      setShowLogSession(false);
    } else {
      alert('Error: '+(data.error||'Could not save session'));
    }
    setSv(false);
  }
  async function setStat(s){
    setSv(true);const u={status:s};if(s==='active')u.last_payment=todayStr();
    await supabase.from('members').update(u).eq('id',id);
    await supabase.from('members').update(u).eq('primary_member_id',id);
    setMembers(ms=>ms.map(x=>x.id===id||x.primary_member_id===id?{...x,...u}:x));
    setSv(false);onClose();
  }
  async function deleteMember(){
    if(!window.confirm(`Permanently delete ${m.name}?`))return;
    setSv(true);
    await supabase.from('sessions').delete().eq('member_id',id);
    await supabase.from('members').delete().eq('id',id);
    setMembers(ms=>ms.filter(x=>x.id!==id));
    setSv(false);onClose();
  }
  async function cancelSub(){
    if(!m.stripe_subscription_id){alert('No Stripe subscription ID on file.');return;}
    setCanc(true);
    const r=await fetch('/api/cancel-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscriptionId:m.stripe_subscription_id,memberId:id})});
    const d=await r.json();
    if(d.success){setMembers(ms=>ms.map(x=>x.id===id?{...x,status:'inactive',stripe_subscription_id:null}:x));onClose();}
    else alert('Error: '+d.error);
    setCanc(false);setConf(false);
  }
  async function generatePayLink(){
    if(!payAmount||isNaN(payAmount)||+payAmount<1)return;
    setGenLoading(true);setGeneratedLink(null);
    const res=await fetch('/api/create-payment-link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:+payAmount,memberId:id,memberName:m.name,memberEmail:m.email})});
    const data=await res.json();
    if(data.url)setGeneratedLink(data.url);
    else alert('Error: '+data.error);
    setGenLoading(false);
  }
  async function savePrimaryLink(){
    setSv(true);
    const updates={primary_member_id:selectedPrimary||null};
    if(selectedPrimary){const pm=members.find(x=>x.id===selectedPrimary);if(pm)updates.status=pm.status;}
    await supabase.from('members').update(updates).eq('id',id);
    setMembers(ms=>ms.map(x=>x.id===id?{...x,...updates}:x));
    setSv(false);setShowLink(false);
  }
  const statusColor={active:GRN,overdue:ORG,pending:BLUE,inactive:'#444'};

  return <Modal open title="Member" onClose={onClose} wide ch={<>
    <div style={{background:SURF,borderRadius:10,padding:'14px 16px',marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
        <div style={{position:'relative',flexShrink:0}}>
          {m.avatar_url
            ?<img src={m.avatar_url} alt={m.name} style={{width:58,height:58,borderRadius:10,objectFit:'cover',border:`2px solid ${G}40`}}/>
            :<div style={{width:58,height:58,borderRadius:10,background:GK,border:`2px solid ${G}40`,display:'flex',alignItems:'center',justifyContent:'center',color:G,fontSize:18,fontWeight:800,fontFamily:F}}>{ini(m.name)}</div>
          }
          <label style={{position:'absolute',bottom:-4,right:-4,width:20,height:20,background:G,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:11}}>
            {uploading?'…':'📷'}
            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>e.target.files[0]&&uploadAvatar(e.target.files[0])}/>
          </label>
        </div>
        <div style={{flex:1}}>
          <div style={{color:'#fff',fontSize:20,fontWeight:800,fontFamily:FB}}>{m.name}</div>
          <div style={{color:'#555',fontSize:13,fontFamily:FB,marginTop:1}}>{m.email}</div>
          <div style={{marginTop:8,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><BB belt={m.belt||'White'} stripes={m.stripes||0} lg/><div style={{display:'flex',alignItems:'center',gap:5}}><SDot status={m.status}/><span style={{color:statusColor[m.status]||'#444',fontSize:13,fontFamily:F,fontWeight:800}}>{m.status}</span></div></div>
        </div>
        <button onClick={()=>setShowEditInfo(!showEditInfo)} style={{padding:'6px 12px',background:'transparent',border:`1px solid ${BL}`,borderRadius:6,color:'#777',fontSize:11,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',flexShrink:0}}>Edit</button>
      </div>
      {showEditInfo&&<div style={{borderTop:`1px solid ${BL}`,paddingTop:12,display:'flex',flexDirection:'column',gap:10}}>
        <div><FL ch="Name"/><input value={editName} onChange={e=>setEditName(e.target.value)} style={{...inpStyle,fontSize:15,padding:'10px 14px'}}/></div>
        <div style={{display:'flex',gap:10}}>
          <div style={{flex:1}}><FL ch="Phone"/><input value={editPhone} onChange={e=>setEditPhone(e.target.value)} placeholder="802-555-0000" style={{...inpStyle,fontSize:15,padding:'10px 14px'}}/></div>
          <div style={{flex:1}}><FL ch="Date of Birth"/><input type="date" value={editDOB} onChange={e=>setEditDOB(e.target.value)} style={{...inpStyle,fontSize:15,padding:'10px 14px'}}/></div>
        </div>
        <GBtn ch={sv?'Saving...':'Save Info'} onClick={saveInfo} sm disabled={sv} style={{alignSelf:'flex-start'}}/>
      </div>}
    </div>
    {(m.phone||m.emergency_contact)&&<div style={{background:SURF,borderRadius:8,padding:'12px 14px',marginBottom:12}}>
      {m.phone&&<div style={{color:'#888',fontSize:14,fontFamily:FB,marginBottom:3}}>📱 {m.phone}</div>}
      {m.emergency_contact&&<div style={{color:'#888',fontSize:14,fontFamily:FB}}>🚨 {m.emergency_contact}</div>}
    </div>}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
      <div onClick={loadSessionLog} style={{background:SURF,border:`1px solid ${G}40`,borderRadius:8,padding:'12px',textAlign:'center',cursor:'pointer'}}>
        <div style={{color:'#444',fontSize:10,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F}}>Sessions</div>
        <div style={{color:'#fff',fontSize:20,fontWeight:900,fontFamily:FN,marginTop:4}}>{m.sessions||0}</div>
        <div style={{color:GD,fontSize:9,fontFamily:F,letterSpacing:1,textTransform:'uppercase',marginTop:3}}>View Log</div>
      </div>
      <div style={{background:SURF,borderRadius:8,padding:'12px',textAlign:'center'}}>
        <div style={{color:'#444',fontSize:10,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F}}>Status</div>
        <div style={{color:statusColor[m.status]||'#444',fontSize:20,fontWeight:900,fontFamily:FN,marginTop:4}}>{m.status}</div>
      </div>
      <div style={{background:SURF,borderRadius:8,padding:'12px',textAlign:'center'}}>
        <div style={{color:'#444',fontSize:10,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F}}>Since</div>
        <div style={{color:'#fff',fontSize:20,fontWeight:900,fontFamily:FN,marginTop:4}}>{m.joined_at?new Date(m.joined_at).getFullYear():'—'}</div>
      </div>
    </div>
    {m.status==='overdue'&&<div style={{background:'#1a0800',border:'1px solid #7a3300',borderRadius:8,padding:'12px 14px',marginBottom:12,color:ORG,fontSize:14,fontFamily:FB}}>Payment {od} day{od!==1?'s':''} overdue</div>}

    {/* Payment */}
    <div style={{background:SURF,borderRadius:8,padding:'14px 16px',marginBottom:12}}>
      <SLabel ch="Payment"/>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:m.stripe_customer_id?10:0}}>
        <div><div style={{color:'#444',fontSize:11,fontFamily:FB,marginBottom:3}}>Last paid</div><div style={{color:'#fff',fontSize:15,fontWeight:700,fontFamily:FB}}>{m.last_payment?fmt(m.last_payment):'—'}</div></div>
        <div style={{textAlign:'right'}}><div style={{color:'#444',fontSize:11,fontFamily:FB,marginBottom:3}}>Next due</div><div style={{color:m.status==='overdue'?ORG:GRN,fontSize:15,fontWeight:700,fontFamily:FB}}>{m.last_payment?nxPay(m.last_payment):'—'}</div></div>
      </div>
      {m.stripe_customer_id&&<a href={`https://dashboard.stripe.com/customers/${m.stripe_customer_id}`} target="_blank" rel="noreferrer" style={{display:'block',textAlign:'center',padding:'8px',border:`1px solid ${BL}`,borderRadius:6,color:GD,fontSize:12,fontFamily:F,letterSpacing:1,textTransform:'uppercase',textDecoration:'none',marginTop:8}}>View in Stripe ↗</a>}
      <button onClick={sendPasswordReset} style={{width:'100%',marginTop:8,padding:'9px',background:'transparent',border:`1px solid ${BL}`,borderRadius:6,color:pwResetSent?GRN:'#555',fontSize:11,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>
        {pwResetSent?'✓ Reset Email Sent':'Send Password Reset Email'}
      </button>
    </div>

    {/* Belt */}
    <div style={{background:SURF,borderRadius:8,padding:'14px 16px',marginBottom:12}}>
      <SLabel ch="Update Belt"/>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{flex:1}}><FS value={belt} onChange={e=>{setBelt(e.target.value);if(isKidsBelt(e.target.value))setStr(0);}} options={BELTS}/></div>
        {!isKidsBelt(belt)&&<div style={{width:90}}><FS value={stripes} onChange={e=>setStr(+e.target.value)} options={[0,1,2,3,4].map(n=>({v:n,l:n}))}/></div>}
        <GBtn ch="Save" onClick={saveBelt} sm disabled={sv}/>
      </div>
    </div>

    {/* Family link */}
    <div style={{background:SURF,borderRadius:8,padding:'14px 16px',marginBottom:12}}>
      <SLabel ch="Family / Payment Link"/>
      {primaryMember&&<div style={{color:'#888',fontSize:14,fontFamily:FB,marginBottom:8}}>Paying via <span style={{color:G,fontWeight:700}}>{primaryMember.name}</span><button onClick={()=>{setSelectedPrimary('');setShowLink(true);}} style={{marginLeft:10,background:'none',border:'none',color:'#555',fontSize:11,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>Change</button></div>}
      {dependents.length>0&&<div style={{marginBottom:8}}>{dependents.map(d=><div key={d.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><SDot status={d.status}/><span style={{color:'#fff',fontSize:14,fontFamily:FB}}>{d.name}</span><span style={{color:'#444',fontSize:12,fontFamily:F,marginLeft:'auto'}}>{d.status}</span></div>)}</div>}
      {!showLink&&!primaryMember&&dependents.length===0&&<GhBtn ch="Link to Primary Member" onClick={()=>{setSelectedPrimary('');setShowLink(true);}} style={{width:'100%',textAlign:'center'}}/>}
      {showLink&&<div>
        <FL ch="Select Primary Member"/>
        <select value={selectedPrimary} onChange={e=>setSelectedPrimary(e.target.value)} style={{...inpStyle,marginBottom:8}}>
          <option value=''>— No primary (standalone) —</option>
          {members.filter(x=>x.id!==id&&!x.primary_member_id).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <div style={{display:'flex',gap:8}}>
          <GhBtn ch="Cancel" onClick={()=>setShowLink(false)} style={{flex:1}}/>
          <GBtn ch={sv?'Saving...':'Save'} onClick={savePrimaryLink} style={{flex:2,opacity:sv?.6:1}} disabled={sv}/>
        </div>
      </div>}
    </div>

    {/* Actions */}
    <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
      <button onClick={openLogSession} disabled={sv} style={{flex:'1 1 120px',padding:14,background:'#0a1a0a',border:`1px solid #2a6a2a`,borderRadius:8,color:GRN,fontSize:13,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>+ Session</button>
      {m.status!=='active'?<button onClick={()=>setStat('active')} disabled={sv} style={{flex:'1 1 120px',padding:14,background:'#0a1a0a',border:`1px solid #2a6a2a`,borderRadius:8,color:GRN,fontSize:13,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>Mark Active</button>
      :<button onClick={()=>setStat('inactive')} disabled={sv} style={{flex:'1 1 120px',padding:14,background:SURF,border:`1px solid ${BL}`,borderRadius:8,color:'#555',fontSize:13,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>Deactivate</button>}
    </div>

    {m.status==='pending'&&!showPayLink&&<button onClick={()=>setShowPayLink(true)} style={{width:'100%',padding:14,background:'#0a1020',border:'1px solid #2a5a8a',borderRadius:8,color:BLUE,fontSize:13,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',marginBottom:10}}>Send Payment Link</button>}
    {showPayLink&&<div style={{background:'#0a1020',border:'1px solid #2a3a5a',borderRadius:8,padding:'16px',marginBottom:10}}>
      <div style={{color:BLUE,fontSize:11,fontWeight:800,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>Generate Payment Link</div>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
        <div style={{color:'#fff',fontSize:18,fontWeight:800,fontFamily:F}}>$</div>
        <input value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder="140" type="number" style={{...inpStyle,flex:1}}/>
        <GBtn ch={genLoading?'...':'Generate'} onClick={generatePayLink} disabled={genLoading||!payAmount} sm/>
      </div>
      {generatedLink&&<div style={{background:SURF,borderRadius:6,padding:'12px'}}>
        <div style={{color:BLUE,fontSize:10,fontWeight:800,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',marginBottom:6}}>Payment Link Ready</div>
        <div style={{color:'#fff',fontSize:12,fontFamily:FB,wordBreak:'break-all',marginBottom:10}}>{generatedLink}</div>
        <button onClick={()=>navigator.clipboard.writeText(generatedLink)} style={{width:'100%',padding:'10px',background:G,border:'none',borderRadius:6,color:'#000',fontSize:12,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>Copy Link</button>
        <div style={{color:'#444',fontSize:11,fontFamily:FB,marginTop:8,textAlign:'center'}}>Text or email this to {m.name}</div>
      </div>}
      {!generatedLink&&<GhBtn ch="Cancel" onClick={()=>setShowPayLink(false)} style={{width:'100%',textAlign:'center'}}/>}
    </div>}

    {m.stripe_subscription_id&&!conf&&<DBtn ch="Cancel Subscription" onClick={()=>setConf(true)} style={{width:'100%',marginBottom:8}}/>}
    {conf&&<div style={{background:'#1a0808',border:'1px solid #6a2020',borderRadius:8,padding:'14px',marginBottom:8}}>
      <div style={{color:RED,fontSize:14,fontFamily:FB,marginBottom:12}}>This cancels the Stripe subscription immediately. Cannot be undone.</div>
      <div style={{display:'flex',gap:8}}><GhBtn ch="Keep It" onClick={()=>setConf(false)} style={{flex:1}}/><DBtn ch={cancelling?'Cancelling...':'Yes, Cancel'} onClick={cancelSub} style={{flex:1}} disabled={cancelling}/></div>
    </div>}

    {/* Session log modal */}
    {showSessionLog&&<div style={{background:SURF,border:`1px solid ${BL}`,borderRadius:10,padding:'16px',marginBottom:10}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div style={{color:G,fontSize:13,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase'}}>Session Log — {m.name}</div>
        <button onClick={()=>setShowSessionLog(false)} style={{background:'none',border:'none',color:'#555',fontSize:18,cursor:'pointer',padding:'0 4px'}}>×</button>
      </div>
      {sessionLogLoading&&<div style={{color:'#555',fontSize:13,fontFamily:FB,padding:'10px 0'}}>Loading...</div>}
      {!sessionLogLoading&&sessionLog.length===0&&<div style={{color:'#555',fontSize:13,fontFamily:FB}}>No sessions logged yet.</div>}
      <div style={{maxHeight:280,overflowY:'auto'}}>
        {sessionLog.map(s=><div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:`1px solid ${BL}`}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:G,flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{color:'#fff',fontSize:14,fontFamily:FB,fontWeight:600}}>{new Date(s.session_date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</div>
            {s.note&&<div style={{color:'#555',fontSize:12,fontFamily:FB,marginTop:2}}>{s.note}</div>}
          </div>
          {confirmDelSession===s.id
            ?<div style={{display:'flex',gap:6,alignItems:'center'}}>
              <span style={{color:'#888',fontSize:11,fontFamily:FB}}>Sure?</span>
              <button onClick={()=>deleteSession(s.id)} style={{padding:'3px 10px',background:'#3a0a0a',border:'1px solid #7a2020',borderRadius:4,color:RED,fontSize:11,fontFamily:F,letterSpacing:1,cursor:'pointer'}}>Yes</button>
              <button onClick={()=>setConfirmDelSession(null)} style={{padding:'3px 10px',background:'transparent',border:`1px solid ${BL}`,borderRadius:4,color:'#555',fontSize:11,fontFamily:F,cursor:'pointer'}}>No</button>
            </div>
            :<button onClick={()=>setConfirmDelSession(s.id)} style={{padding:'3px 10px',background:'transparent',border:'1px solid #3a1000',borderRadius:4,color:'#6a2a00',fontSize:10,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',flexShrink:0}}>Delete</button>
          }
        </div>)}
      </div>
    </div>}

    {showLogSession&&<div style={{background:'#0a1a0a',border:'1px solid #2a6a2a',borderRadius:10,padding:'16px',marginBottom:10}}>
      <div style={{color:GRN,fontSize:13,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',marginBottom:12}}>Log Session for {m.name}</div>
      <div style={{marginBottom:12}}>
        <FL ch="Session Date"/>
        <input type="date" value={logSessionDate} max={todayStr()} onChange={e=>setLogSessionDate(e.target.value)} style={{...inpStyle,fontSize:15,padding:'10px 14px'}}/>
      </div>
      <div style={{display:'flex',gap:8}}>
        <GhBtn ch="Cancel" onClick={()=>setShowLogSession(false)} style={{flex:1}}/>
        <button onClick={confirmLogSession} disabled={sv} style={{flex:2,padding:'11px',background:'#1a4a1a',border:'1px solid #2a6a2a',borderRadius:6,color:GRN,fontSize:13,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',opacity:sv?.6:1}}>{sv?'Saving...':'Confirm Session'}</button>
      </div>
    </div>}

    <div style={{display:'flex',gap:8,marginTop:4}}>
      <GhBtn ch="Close" onClick={onClose} style={{flex:1,textAlign:'center'}}/>
      <DBtn ch="Delete" onClick={deleteMember} style={{flex:1,textAlign:'center'}} disabled={sv}/>
    </div>
  </>}/>;
}

// ---- PAYMENTS ----
function PaymentsView({members,setMembers}){
  const sorted=[...members].sort((a,b)=>({overdue:0,pending:1,active:2,inactive:3}[a.status]-{overdue:0,pending:1,active:2,inactive:3}[b.status]));
  const od=members.filter(m=>m.status==='overdue').length;
  const [sv,setSv]=useState(null);
  async function markPaid(id){setSv(id);const lp=todayStr();const nx=new Date();nx.setMonth(nx.getMonth()+1);await supabase.from('members').update({status:'active',last_payment:lp,next_payment_date:nx.toISOString().split('T')[0]}).eq('id',id);setMembers(ms=>ms.map(m=>m.id===id?{...m,status:'active',last_payment:lp}:m));setSv(null);}
  return <>
    {od>0&&<div style={{background:'#1a0800',border:'1px solid #7a3300',borderRadius:8,padding:'14px 16px',marginBottom:14,color:ORG,fontSize:15,fontFamily:FB,fontWeight:700}}>{od} member{od!==1?'s':''} with overdue payments</div>}
    {sorted.map(m=>{
      const isOD=m.status==='overdue';
      const od2=isOD&&m.last_payment?dOD(m.last_payment):0;
      const nx=m.last_payment?new Date(m.last_payment):null;if(nx)nx.setMonth(nx.getMonth()+1);
      return <div key={m.id} style={{background:isOD?'#100800':CARD,border:`1px solid ${isOD?'#4a2000':BL}`,borderRadius:10,marginBottom:8,padding:'16px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:42,height:42,borderRadius:8,background:GK,border:`1.5px solid ${GD}`,display:'flex',alignItems:'center',justifyContent:'center',color:G,fontSize:13,fontWeight:800,fontFamily:F,flexShrink:0}}>{ini(m.name)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:'#fff',fontSize:16,fontWeight:700,fontFamily:FB,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
            <div style={{color:'#444',fontSize:12,marginTop:2,fontFamily:FB}}>Last paid {m.last_payment?fmt(m.last_payment):'never'}</div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{color:'#333',fontSize:10,fontFamily:F,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>{isOD?'Overdue':'Next due'}</div>
            <div style={{color:isOD?ORG:m.status==='active'?GRN:'#555',fontSize:16,fontWeight:800,fontFamily:FN,marginTop:2}}>{isOD?`${od2}d`:nx?nx.toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—'}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
          {m.status!=='active'&&<button onClick={()=>markPaid(m.id)} disabled={sv===m.id} style={{flex:'1 1 120px',padding:'10px',background:'transparent',border:'1px solid #2a6a2a',borderRadius:6,color:GRN,fontSize:12,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',opacity:sv===m.id?.6:1}}>{sv===m.id?'Saving...':'Mark as Paid'}</button>}
          {m.stripe_customer_id&&<a href={`https://dashboard.stripe.com/customers/${m.stripe_customer_id}`} target="_blank" rel="noreferrer" style={{flex:'1 1 100px',padding:'10px',background:'transparent',border:`1px solid ${BL}`,borderRadius:6,color:GD,fontSize:12,fontFamily:F,letterSpacing:1,textTransform:'uppercase',textDecoration:'none',textAlign:'center'}}>Stripe ↗</a>}
        </div>
      </div>;
    })}
  </>;
}

// ---- SCHEDULE ----
function ScheduleView({schedule,setSchedule}){
  const [mode,setMode]=useState('week');
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({day_of_week:1,start_time:'18:30',class_name:'',type:'Gi',instructor:''});
  const [sv,setSv]=useState(false);
  const [confirmDelId,setConfirmDelId]=useState(null);
  const [confirmDelName,setConfirmDelName]=useState('');
  async function openEdit(c){setModal(c?c.id:'new');setForm(c?{day_of_week:c.day_of_week,start_time:c.start_time,class_name:c.class_name,type:c.type,instructor:c.instructor||''}:{day_of_week:1,start_time:'18:30',class_name:'',type:'Gi',instructor:''});}
  async function save(){
    if(!form.class_name.trim())return;
    setSv(true);
    const payload={...form,day_of_week:+form.day_of_week};
    if(modal==='new'){
      const res=await fetch('/api/schedule',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const d=await res.json();
      if(d.class)setSchedule(s=>[...s,d.class].sort((a,b)=>a.day_of_week-b.day_of_week||a.start_time.localeCompare(b.start_time)));
      else alert('Error saving class: '+(d.error||'Unknown error'));
    } else {
      const res=await fetch('/api/schedule',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:modal,...payload})});
      const d=await res.json();
      if(d.success)setSchedule(s=>s.map(c=>c.id===modal?{...c,...payload}:c));
      else alert('Error updating class: '+(d.error||'Unknown error'));
    }
    setSv(false);setModal(null);
  }
  function del(id,name){
    setConfirmDelId(id);
    setConfirmDelName(name);
  }
  async function confirmDel(){
    const id=confirmDelId;
    setConfirmDelId(null);
    const res=await fetch('/api/schedule',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
    const d=await res.json();
    if(d.success)setSchedule(s=>s.filter(c=>c.id!==id));
    else alert('Error removing class: '+(d.error||'Unknown error'));
  }
  const sorted=[...schedule].sort((a,b)=>a.day_of_week-b.day_of_week||a.start_time.localeCompare(b.start_time));
  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,gap:10,flexWrap:'wrap'}}>
      <div style={{fontWeight:800,fontSize:26,letterSpacing:1,color:'#fff',fontFamily:FB}}>Schedule</div>
      <div style={{display:'flex',gap:6}}>
        {['week','list'].map(v=><button key={v} onClick={()=>setMode(v)} style={{padding:'7px 16px',background:mode===v?G:'transparent',border:mode===v?'none':`1px solid ${BL}`,borderRadius:20,color:mode===v?'#000':'#555',fontSize:11,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>{v}</button>)}
        <GBtn ch="+ Class" onClick={()=>openEdit(null)} sm/>
      </div>
    </div>
    {mode==='week'?DAYS.map((day,di)=>{
      const cls=schedule.filter(c=>c.day_of_week===di).sort((a,b)=>a.start_time.localeCompare(b.start_time));
      return <div key={day} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,marginBottom:8,overflow:'hidden'}}>
        <div style={{display:'flex',gap:14,padding:'14px 18px',alignItems:cls.length?'flex-start':'center'}}>
          <div style={{width:46,height:46,borderRadius:8,background:cls.length?GK:'transparent',border:`1.5px solid ${cls.length?G:BL}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span style={{fontWeight:800,fontSize:11,fontFamily:F,letterSpacing:1,color:cls.length?G:'#333',textTransform:'uppercase'}}>{DAYSS[di]}</span>
            {cls.length>0&&<span style={{fontSize:9,color:GD,fontFamily:F,fontWeight:700}}>{cls.length} {cls.length===1?'class':'classes'}</span>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            {cls.length===0?<span style={{color:'#333',fontSize:14,fontFamily:FB}}>Rest Day</span>
            :cls.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8,padding:'8px 10px',background:SURF,borderRadius:6}}>
              <span style={{color:G,fontSize:15,fontWeight:900,fontFamily:FN,flexShrink:0}}>{c.start_time.slice(0,5)}</span>
              <span style={{color:'#fff',fontSize:14,fontWeight:600,fontFamily:FB}}>{c.class_name}</span>
              <TPill type={c.type}/>
              {c.instructor&&<span style={{color:'#555',fontSize:13,fontFamily:FB}}>{c.instructor}</span>}
              <div style={{marginLeft:'auto',display:'flex',gap:5}}>
                <button onClick={()=>openEdit(c)} style={{padding:'4px 10px',background:'transparent',border:`1px solid ${BL}`,borderRadius:4,color:'#555',fontSize:10,fontFamily:F,cursor:'pointer'}}>Edit</button>
                <button onClick={()=>del(c.id,c.class_name)} style={{padding:'4px 10px',background:'transparent',border:'1px solid #4a1000',borderRadius:4,color:'#7a2a00',fontSize:10,fontFamily:F,cursor:'pointer'}}>×</button>
              </div>
            </div>)}
          </div>
        </div>
      </div>;
    }):sorted.map(c=><div key={c.id} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,marginBottom:6,padding:'12px 18px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
      <span style={{color:GD,fontSize:12,fontFamily:F,fontWeight:700,width:30,flexShrink:0}}>{DAYSS[c.day_of_week]?.toUpperCase()}</span>
      <span style={{color:G,fontSize:16,fontWeight:900,fontFamily:FN,flexShrink:0}}>{c.start_time.slice(0,5)}</span>
      <span style={{color:'#fff',fontSize:14,fontFamily:FB}}>{c.class_name}</span>
      <TPill type={c.type}/>
      {c.instructor&&<span style={{color:'#555',fontSize:13,fontFamily:FB}}>{c.instructor}</span>}
      <div style={{marginLeft:'auto',display:'flex',gap:5}}>
        <button onClick={()=>openEdit(c)} style={{padding:'4px 10px',background:'transparent',border:`1px solid ${BL}`,borderRadius:4,color:'#555',fontSize:10,fontFamily:F,cursor:'pointer'}}>Edit</button>
        <button onClick={()=>del(c.id,c.class_name)} style={{padding:'4px 10px',background:'transparent',border:'1px solid #4a1000',borderRadius:4,color:'#7a2a00',fontSize:10,fontFamily:F,cursor:'pointer'}}>×</button>
      </div>
    </div>)}
    <Modal open={confirmDelId!==null} onClose={()=>setConfirmDelId(null)} title="Remove Class" ch={<div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{color:'#888',fontSize:15,fontFamily:FB,lineHeight:1.6}}>Remove <strong style={{color:'#fff'}}>{confirmDelName}</strong> from the schedule?</div>
      <div style={{display:'flex',gap:10}}>
        <GhBtn ch="Keep It" onClick={()=>setConfirmDelId(null)} style={{flex:1}}/>
        <DBtn ch="Yes, Remove" onClick={confirmDel} style={{flex:1}}/>
      </div>
    </div>}/>

    <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==='new'?'Add Class':'Edit Class'} ch={<div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',gap:12}}><div style={{flex:1}}><FL ch="Day"/><FS value={form.day_of_week} onChange={e=>setForm(f=>({...f,day_of_week:+e.target.value}))} options={DAYS.map((d,i)=>({v:i,l:d}))}/></div><div style={{flex:1}}><FL ch="Time"/><input type="time" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))} style={inpStyle}/></div></div>
      <div><FL ch="Class Name"/><FI value={form.class_name} onChange={e=>setForm(f=>({...f,class_name:e.target.value}))} placeholder="e.g. Fundamentals"/></div>
      <div style={{display:'flex',gap:12}}><div style={{flex:1}}><FL ch="Type"/><FS value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} options={TYPES}/></div><div style={{flex:1}}><FL ch="Instructor"/><FI value={form.instructor} onChange={e=>setForm(f=>({...f,instructor:e.target.value}))} placeholder="Optional"/></div></div>
      <div style={{display:'flex',gap:10,marginTop:4}}><GhBtn ch="Cancel" onClick={()=>setModal(null)} style={{flex:1}}/><GBtn ch={sv?'Saving...':'Save Class'} onClick={save} style={{flex:2,opacity:sv?.6:1}} disabled={sv}/></div>
    </div>}/>
  </>;
}

// ---- PRODUCTS ----
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
      <div style={{fontWeight:800,fontSize:26,letterSpacing:1,color:'#fff',fontFamily:FB}}>Gear & Products</div>
      <GBtn ch="+ Product" onClick={()=>{setModal('new');setForm({name:'',description:'',price_cents:'',inventory:''});}} sm/>
    </div>
    {products.length===0&&<div style={{textAlign:'center',color:'#333',padding:'60px 0',fontFamily:FB,fontSize:15}}>No products yet.</div>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
      {products.map(p=><div key={p.id} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,padding:18}}>
        <div style={{color:'#fff',fontSize:16,fontWeight:800,fontFamily:FB,marginBottom:4}}>{p.name}</div>
        {p.description&&<div style={{color:'#555',fontSize:13,fontFamily:FB,marginBottom:12,lineHeight:1.5}}>{p.description}</div>}
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:14}}>
          <div style={{color:G,fontSize:28,fontWeight:900,fontFamily:FN,letterSpacing:-1}}>{fmtPrice(p.price_cents)}</div>
          <div style={{color:'#444',fontSize:12,fontFamily:F}}>{p.inventory!=null?`${p.inventory} left`:'In stock'}</div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <GBtn ch="Charge" onClick={()=>{setChargeModal(p);setChargeMem('');}} sm style={{flex:1}}/>
          <button onClick={()=>{setModal(p.id);setForm({name:p.name,description:p.description||'',price_cents:(p.price_cents/100).toFixed(2),inventory:p.inventory??''});}} style={{padding:'8px 12px',background:'transparent',border:`1px solid ${BL}`,borderRadius:6,color:'#555',fontSize:11,fontFamily:F,cursor:'pointer'}}>Edit</button>
          <button onClick={()=>archiveP(p.id)} style={{padding:'8px 12px',background:'transparent',border:'1px solid #4a1000',borderRadius:6,color:'#7a2a00',fontSize:11,fontFamily:F,cursor:'pointer'}}>×</button>
        </div>
      </div>)}
    </div>
    <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==='new'?'Add Product':'Edit Product'} ch={<div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div><FL ch="Name"/><FI value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="High Hat Rashguard"/></div>
      <div><FL ch="Description (optional)"/><FI value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Short description"/></div>
      <div style={{display:'flex',gap:12}}><div style={{flex:1}}><FL ch="Price ($)"/><FI value={form.price_cents} onChange={e=>setForm(f=>({...f,price_cents:e.target.value}))} placeholder="35.00" type="number"/></div><div style={{flex:1}}><FL ch="Inventory (blank=unlimited)"/><FI value={form.inventory} onChange={e=>setForm(f=>({...f,inventory:e.target.value}))} placeholder="10" type="number"/></div></div>
      <div style={{display:'flex',gap:10,marginTop:4}}><GhBtn ch="Cancel" onClick={()=>setModal(null)} style={{flex:1}}/><GBtn ch={sv?'Saving...':'Save'} onClick={saveP} style={{flex:2,opacity:sv?.6:1}} disabled={sv}/></div>
    </div>}/>
    <Modal open={chargeModal!==null} onClose={()=>setChargeModal(null)} title="Charge Member" ch={chargeModal&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{background:SURF,borderRadius:8,padding:'14px'}}><div style={{color:'#fff',fontSize:16,fontWeight:800,fontFamily:FB}}>{chargeModal.name}</div><div style={{color:G,fontSize:26,fontWeight:900,fontFamily:FN,marginTop:4}}>{fmtPrice(chargeModal.price_cents)}</div></div>
      <div><FL ch="Select Member"/><select value={chargeMem} onChange={e=>setChargeMem(e.target.value)} style={inpStyle}><option value=''>— Choose member —</option>{members.filter(m=>m.stripe_customer_id).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div style={{background:SURF,borderRadius:6,padding:'12px',color:'#555',fontSize:13,fontFamily:FB,lineHeight:1.6}}>Opens the member's Stripe page to create a one-time invoice.</div>
      <div style={{display:'flex',gap:10}}><GhBtn ch="Cancel" onClick={()=>setChargeModal(null)} style={{flex:1}}/><GBtn ch="Open in Stripe ↗" onClick={chargeViaStripe} style={{flex:2}} disabled={!chargeMem}/></div>
    </div>}/>
  </>;
}

// ---- ANALYTICS ----
function RecentPromotions(){
  const [promos,setPromos]=useState([]);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{
    supabase.from('promotions').select('*').order('promoted_at',{ascending:false}).limit(15).then(({data})=>{setPromos(data||[]);setLoaded(true);});
  },[]);
  const fmt=d=>new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const bc=b=>({White:'#e8e8e0',Grey:'#888',Yellow:'#c9a227',Orange:'#c97316',Green:'#2a6a2a',Blue:'#1a3a6e',Purple:'#3e1460',Brown:'#4a2000',Black:'#222'}[b]||'#444');
  const btx=b=>(['White','Yellow'].includes(b)?'#000':'#fff');
  const kids=b=>['Grey','Yellow','Orange','Green'].includes(b);
  if(!loaded)return <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,padding:20,marginTop:14,color:'#333',fontSize:14,fontFamily:FB}}>Loading promotions...</div>;
  return <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,padding:20,marginTop:14}}>
    <SLabel ch="Recent Promotions"/>
    {promos.length===0&&<div style={{color:'#333',fontSize:14,fontFamily:FB}}>No promotions logged yet.</div>}
    {promos.map(p=><div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${BL}`}}>
      <div style={{width:36,height:36,borderRadius:8,background:GK,border:`1.5px solid ${GD}`,display:'flex',alignItems:'center',justifyContent:'center',color:G,fontSize:11,fontWeight:800,fontFamily:F,flexShrink:0}}>{p.member_name?p.member_name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2):'?'}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:'#fff',fontSize:14,fontWeight:700,fontFamily:FB,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.member_name}</div>
        <div style={{display:'flex',alignItems:'center',gap:5,marginTop:4,flexWrap:'wrap'}}>
          <span style={{padding:'2px 6px',background:bc(p.old_belt),borderRadius:3,fontSize:9,fontWeight:800,fontFamily:F,color:btx(p.old_belt),letterSpacing:1,textTransform:'uppercase'}}>{p.old_belt}{!kids(p.old_belt)&&p.old_stripes>0?` ${p.old_stripes}s`:''}</span>
          <span style={{color:'#444',fontSize:12}}>→</span>
          <span style={{padding:'2px 6px',background:bc(p.new_belt),borderRadius:3,fontSize:9,fontWeight:800,fontFamily:F,color:btx(p.new_belt),letterSpacing:1,textTransform:'uppercase'}}>{p.new_belt}{!kids(p.new_belt)&&p.new_stripes>0?` ${p.new_stripes}s`:''}</span>
          {p.promoted_by==='self'&&<span style={{color:BLUE,fontSize:9,fontFamily:F,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>self</span>}
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
        <div style={{color:'#333',fontSize:12,fontFamily:F}}>{fmt(p.promoted_at)}</div>
        <button onClick={async()=>{if(!window.confirm('Delete this promotion record?'))return;await supabase.from('promotions').delete().eq('id',p.id);setPromos(ps=>ps.filter(x=>x.id!==p.id));}} style={{padding:'2px 8px',background:'transparent',border:'1px solid #4a1000',borderRadius:4,color:'#7a2a00',fontSize:9,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>Delete</button>
      </div>
    </div>)}
  </div>;
}

function AnalyticsView({members}){
  const total=members.length;
  const active=members.filter(m=>m.status==='active');
  const t60=members.filter(m=>m.last_trained&&Math.floor((TODAY-new Date(m.last_trained))/86400000)<=60);
  const t30=members.filter(m=>m.last_trained&&Math.floor((TODAY-new Date(m.last_trained))/86400000)<=30);
  const ret=t60.length?Math.round((t30.length/t60.length)*100):0;
  const newM=members.filter(m=>Math.floor((TODAY-new Date(m.joined_at))/86400000)<=30).length;
  const top=[...members].sort((a,b)=>(b.sessions||0)-(a.sessions||0)).slice(0,5);
  const maxS=top[0]?.sessions||1;
  const r=38,circ=2*Math.PI*r,dash=circ*(ret/100),ringC=ret>=70?GRN:ret>=50?G:ORG;
  const cs={background:CARD,border:`1px solid ${BL}`,borderRadius:10,padding:20,marginBottom:14};
  return <>
    <div style={cs}>
      <SLabel ch="30-Day Retention"/>
      <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
        <div style={{position:'relative',width:90,height:90,flexShrink:0}}>
          <svg width="90" height="90" viewBox="0 0 100 100" style={{transform:'rotate(-90deg)'}}>
            <circle cx="50" cy="50" r={r} fill="none" stroke="#1a1a00" strokeWidth="10"/>
            <circle cx="50" cy="50" r={r} fill="none" stroke={ringC} strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontWeight:900,fontSize:22,color:G,fontFamily:FN,lineHeight:1}}>{ret}%</div>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{color:'#fff',fontSize:15,fontWeight:600,fontFamily:FB,lineHeight:1.5}}>{t30.length} of {t60.length} recent members returned in last 30 days.</div>
          <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap'}}>
            {[{l:'New',v:`+${newM}`,c:GRN},{l:'Active',v:active.length,c:G}].map(x=><div key={x.l} style={{flex:'1 1 80px',background:SURF,borderRadius:8,padding:'12px 14px'}}>
              <div style={{color:'#444',fontSize:10,fontFamily:F,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase'}}>{x.l}</div>
              <div style={{color:x.c,fontSize:26,fontWeight:900,fontFamily:FN,marginTop:3}}>{x.v}</div>
            </div>)}
          </div>
        </div>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
      <div style={cs}>
        <SLabel ch="Top Trainers"/>
        {top.map((m,i)=><div key={m.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <div style={{color:i===0?G:'#2a2200',fontWeight:900,fontSize:20,fontFamily:FN,width:22,textAlign:'center',flexShrink:0}}>{i+1}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:'#fff',fontSize:14,fontWeight:700,fontFamily:FB,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
            <div style={{height:3,background:'#1a1a00',borderRadius:2,marginTop:5}}><div style={{height:3,borderRadius:2,background:G,width:`${((m.sessions||0)/maxS)*100}%`}}/></div>
          </div>
          <div style={{color:G,fontWeight:900,fontSize:16,fontFamily:FN,flexShrink:0}}>{m.sessions||0}</div>
        </div>)}
      </div>
      <div style={cs}>
        <SLabel ch="Belt Breakdown"/>
        {BELTS.map(b=>{const cnt=members.filter(m=>m.belt===b).length;if(!cnt)return null;const c=BELT_CFG[b];return(
          <div key={b} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <BB belt={b} stripes={0}/>
            <div style={{flex:1}}><div style={{height:5,background:'#111',borderRadius:3}}><div style={{height:5,borderRadius:3,background:c.bg==='#e8e8e0'?'#d0d0c8':c.bg,border:`1px solid ${c.br}`,width:`${(cnt/total)*100}%`}}/></div></div>
            <div style={{color:'#fff',fontWeight:800,fontSize:15,fontFamily:FN,width:22,textAlign:'right'}}>{cnt}</div>
          </div>
        );})}
      </div>
    </div>
    <RecentPromotions/>
  </>;
}

// ---- ROOT ----
export default function AdminApp({initialMembers,initialSchedule,initialProducts}){
  const [members,setMembers]=useState(initialMembers);
  const [schedule,setSchedule]=useState(initialSchedule);
  const [products,setProducts]=useState(initialProducts||[]);
  const [view,setView]=useState('roster');
  const [detailId,setDetailId]=useState(null);
  const [showAllSessions,setShowAllSessions]=useState(false);
  const [allSessions,setAllSessions]=useState([]);
  const [allSessionsLoading,setAllSessionsLoading]=useState(false);
  const [confirmDelGlobalSession,setConfirmDelGlobalSession]=useState(null);

  async function loadAllSessions(){
    setAllSessionsLoading(true);
    setShowAllSessions(true);
    const{data}=await supabase.from('sessions').select('*, members(name)').order('session_date',{ascending:false}).limit(200);
    setAllSessions(data||[]);
    setAllSessionsLoading(false);
  }
  async function deleteGlobalSession(sessionId,memberId){
    await supabase.from('sessions').delete().eq('id',sessionId);
    const m=members.find(x=>x.id===memberId);
    if(m){
      const newCount=Math.max(0,(m.sessions||0)-1);
      await supabase.from('members').update({sessions:newCount}).eq('id',memberId);
      setMembers(ms=>ms.map(x=>x.id===memberId?{...x,sessions:newCount}:x));
    }
    setAllSessions(s=>s.filter(x=>x.id!==sessionId));
    setConfirmDelGlobalSession(null);
  }

  const stats=[
    {l:'Pending',v:members.filter(m=>m.status==='pending').length,c:BLUE},
    {l:'Active',v:members.filter(m=>m.status==='active').length,c:GRN},
    {l:'Overdue',v:members.filter(m=>m.status==='overdue').length,c:ORG},
    {l:'Sessions',v:members.reduce((a,m)=>a+(m.sessions||0),0).toLocaleString(),c:G},
  ];

  const navs=[
    {id:'roster',l:'Roster',icon:'◉'},
    {id:'payments',l:'Payments',icon:'◈'},
    {id:'schedule',l:'Schedule',icon:'⊕'},
    {id:'products',l:'Gear',icon:'⊞'},
    {id:'analytics',l:'Stats',icon:'▲'},
  ];

  return <div style={{minHeight:'100vh',background:BG,color:'#fff',fontFamily:FB}}>
    <div style={{height:3,background:`linear-gradient(90deg,${G},${GD})`}}/>
    <div style={{background:SURF,borderBottom:`1px solid ${BL}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',height:60,position:'sticky',top:0,zIndex:40}}>
      <Logo/>
      <div style={{fontSize:10,color:'#555',fontFamily:F,letterSpacing:2,textTransform:'uppercase',fontWeight:800,background:GK,border:`1px solid ${BL}`,padding:'5px 12px',borderRadius:20}}>Admin</div>
    </div>
    <StatBar stats={stats} onSessionsClick={loadAllSessions}/>
    <div style={{padding:'20px',paddingBottom:100}}>
      {view==='roster'&&<RosterView members={members} setMembers={setMembers} openDetail={setDetailId}/>}
      {view==='payments'&&<PaymentsView members={members} setMembers={setMembers}/>}
      {view==='schedule'&&<ScheduleView schedule={schedule} setSchedule={setSchedule}/>}
      {view==='products'&&<ProductsView products={products} setProducts={setProducts} members={members}/>}
      {view==='analytics'&&<AnalyticsView members={members}/>}
    </div>
    <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#0a0a08',borderTop:`1px solid ${BL}`,display:'flex',zIndex:50,paddingBottom:'env(safe-area-inset-bottom)'}}>
      {navs.map(n=>{
        const active=view===n.id;
        return <button key={n.id} onClick={()=>setView(n.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'10px 4px 8px',background:'transparent',border:'none',cursor:'pointer',gap:3,position:'relative'}}>
          {active&&<div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:24,height:3,background:G,borderRadius:'0 0 3px 3px'}}/>}
          <span style={{fontSize:18,lineHeight:1,color:active?G:'#555'}}>{n.icon}</span>
          <span style={{fontSize:9,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',color:active?G:'#444'}}>{n.l}</span>
        </button>;
      })}
    </div>
    <div style={{height:80}}/>
    {detailId&&<DetailModal id={detailId} members={members} setMembers={setMembers} onClose={()=>setDetailId(null)}/>}

    {/* Global sessions modal */}
    {showAllSessions&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:'#0e0e0c',border:`1px solid ${BL}`,borderRadius:'16px 16px 0 0',width:'100%',maxWidth:520,maxHeight:'88vh',display:'flex',flexDirection:'column'}}>
        <div style={{width:40,height:4,background:'#333',borderRadius:2,margin:'12px auto 0',flexShrink:0}}/>
        <div style={{padding:'16px 24px 8px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{fontWeight:800,fontSize:18,letterSpacing:1,color:'#fff',textTransform:'uppercase',fontFamily:F}}>All Sessions</div>
          <button onClick={()=>setShowAllSessions(false)} style={{background:'none',border:'none',color:'#555',fontSize:20,cursor:'pointer'}}>×</button>
        </div>
        <div style={{overflowY:'auto',flex:1,padding:'0 24px 24px'}}>
          {allSessionsLoading&&<div style={{color:'#555',fontSize:14,fontFamily:FB,padding:'20px 0'}}>Loading...</div>}
          {!allSessionsLoading&&allSessions.length===0&&<div style={{color:'#555',fontSize:14,fontFamily:FB,padding:'20px 0'}}>No sessions logged yet.</div>}
          {allSessions.map(s=><div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${BL}`}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:G,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:'#fff',fontSize:14,fontFamily:FB,fontWeight:600}}>{s.members?.name||'Unknown'}</div>
              <div style={{color:'#555',fontSize:12,fontFamily:FB,marginTop:1}}>{new Date(s.session_date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}{s.note&&` — ${s.note}`}</div>
            </div>
            {confirmDelGlobalSession===s.id
              ?<div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
                <span style={{color:'#888',fontSize:11,fontFamily:FB}}>Sure?</span>
                <button onClick={()=>deleteGlobalSession(s.id,s.member_id)} style={{padding:'3px 10px',background:'#3a0a0a',border:'1px solid #7a2020',borderRadius:4,color:RED,fontSize:11,fontFamily:F,letterSpacing:1,cursor:'pointer'}}>Yes</button>
                <button onClick={()=>setConfirmDelGlobalSession(null)} style={{padding:'3px 10px',background:'transparent',border:`1px solid ${BL}`,borderRadius:4,color:'#555',fontSize:11,fontFamily:F,cursor:'pointer'}}>No</button>
              </div>
              :<button onClick={()=>setConfirmDelGlobalSession(s.id)} style={{padding:'3px 10px',background:'transparent',border:'1px solid #3a1000',borderRadius:4,color:'#6a2a00',fontSize:10,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',flexShrink:0}}>Delete</button>
            }
          </div>)}
        </div>
      </div>
    </div>}
  </div>;
}
