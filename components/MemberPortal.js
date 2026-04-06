'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const G='#c9a227',GD='#8a6e18',GK='#1a1400';
const BG='#080808',SURF='#111109',CARD='#161610',BL='#242200';
const GRN='#3dba6b',ORG='#e06c1a',BLUE='#3a7abd';
const F="'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FB="'Barlow',Arial,sans-serif";
const FN="'Barlow Condensed','Arial Narrow',Arial,sans-serif";

const BELT_CFG={
  White:{bg:'#e8e8e0',tx:'#111',br:'#ccc',gl:'rgba(220,220,210,.1)'},
  Grey:{bg:'#777',tx:'#fff',br:'#999',gl:'rgba(120,120,120,.12)'},
  Yellow:{bg:'#c9a227',tx:'#000',br:'#a07800',gl:'rgba(200,160,40,.15)'},
  Orange:{bg:'#c97316',tx:'#fff',br:'#a05010',gl:'rgba(200,115,22,.15)'},
  Green:{bg:'#2a6a2a',tx:'#fff',br:'#1a4a1a',gl:'rgba(42,106,42,.15)'},
  Blue:{bg:'#1a3a6e',tx:'#fff',br:'#2a5aae',gl:'rgba(42,90,174,.18)'},
  Purple:{bg:'#3e1460',tx:'#fff',br:'#6a2aaa',gl:'rgba(106,42,170,.2)'},
  Brown:{bg:'#4a2000',tx:'#fff',br:'#7a3e10',gl:'rgba(122,62,16,.18)'},
  Black:{bg:'#111',tx:'#fff',br:'#444',gl:'rgba(255,255,255,.05)'},
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
const MILES=[{n:10,l:'First 10',i:'🥋'},{n:50,l:'50 Sessions',i:'⚡'},{n:100,l:'Century',i:'💯'},{n:200,l:'Dedicated',i:'🔥'},{n:365,l:'Year on the Mat',i:'📅'},{n:500,l:'500 Club',i:'🏆'}];
const AV_COLORS=['#3e1460','#1a3a6e','#c9a227','#4a2000','#0a3a0a','#3a0a0a','#1a2a1a','#2a1a2a'];
const TODAY=new Date(),TODAYSTR=TODAY.toISOString().split('T')[0];
const ADULT_BELT_ORDER=['White','Blue','Purple','Brown','Black'];
const KIDS_BELT_ORDER=['White','Grey','Yellow','Orange','Green'];
const isKidsBelt=b=>['Grey','Yellow','Orange','Green'].includes(b);
const ini=n=>n?n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2):'?';
const fmtL=d=>new Date(d).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric',year:'numeric'});
const fmtS=d=>new Date(d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
const fmtM=d=>new Date(d).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
const inpStyle={width:'100%',background:SURF,border:`1px solid ${BL}`,borderRadius:6,padding:'13px 16px',color:'#fff',fontSize:16,outline:'none',fontFamily:FB,boxSizing:'border-box',colorScheme:'dark'};

function computeStreak(sessions){
  if(!sessions.length)return 0;
  const s=[...sessions].sort((a,b)=>new Date(b.session_date)-new Date(a.session_date));
  let st=0,cur=new Date(TODAY);
  for(const x of s){const d=new Date(x.session_date);if(Math.round((cur-d)/86400000)<=2){st++;cur=d;}else break;}
  return st;
}

function SLabel({children}){
  return <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
    <div style={{width:3,height:14,background:G,borderRadius:2,flexShrink:0}}/>
    <span style={{color:G,fontSize:11,fontWeight:800,letterSpacing:2.5,textTransform:'uppercase',fontFamily:F}}>{children}</span>
    <div style={{flex:1,height:1,background:BL}}/>
  </div>;
}
function Card({children,style={}}){return <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,marginBottom:14,overflow:'hidden',...style}}>{children}</div>}
function GBtn({children,onClick,style={}}){return <button onClick={onClick} style={{padding:'11px 22px',background:G,border:'none',borderRadius:6,color:'#000',fontWeight:800,fontSize:14,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',...style}}>{children}</button>}
function GhBtn({children,onClick,style={}}){return <button onClick={onClick} style={{padding:'9px 16px',background:'transparent',border:`1px solid ${BL}`,borderRadius:6,color:'#777',fontSize:12,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',...style}}>{children}</button>}
function TPill({type}){const c=TYPE_CFG[type]||TYPE_CFG.Other;return <span style={{padding:'3px 8px',background:c.bg,border:`1px solid ${c.br}`,borderRadius:4,fontSize:10,fontWeight:800,fontFamily:F,color:c.tx,letterSpacing:1,textTransform:'uppercase'}}>{type}</span>}
function FL({children}){return <div style={{color:GD,fontSize:11,letterSpacing:1.5,textTransform:'uppercase',marginBottom:8,fontWeight:800,fontFamily:F}}>{children}</div>}
function Modal({open,onClose,title,children}){
  if(!open)return null;
  return <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
    <div style={{background:'#0e0e0c',border:`1px solid ${BL}`,borderRadius:'16px 16px 0 0',width:'100%',maxWidth:520,maxHeight:'92vh',overflowY:'auto'}}>
      <div style={{width:40,height:4,background:'#333',borderRadius:2,margin:'12px auto 0'}}/>
      <div style={{padding:'20px 24px 32px'}}>
        <div style={{fontWeight:800,fontSize:20,letterSpacing:1,color:'#fff',textTransform:'uppercase',marginBottom:20,fontFamily:F}}>{title}</div>
        {children}
      </div>
    </div>
  </div>;
}

function BeltBar({belt,stripes}){
  const c=BELT_CFG[belt]||BELT_CFG.White,sc=belt==='White'?'#111':'#fff';
  const kids=isKidsBelt(belt);
  return <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
    <div style={{width:kids?150:200,height:30,background:c.bg,border:`2px solid ${c.br}`,borderRadius:4,display:'flex',alignItems:'center',justifyContent:kids?'center':'space-between',padding:'0 12px',boxShadow:`0 0 30px ${c.gl}`}}>
      <span style={{fontSize:13,fontWeight:800,fontFamily:F,color:c.tx,letterSpacing:2,textTransform:'uppercase'}}>{belt} Belt</span>
      {!kids&&<div style={{display:'flex',gap:3}}>{[0,1,2,3,4].map(i=><div key={i} style={{width:9,height:22,borderRadius:2,background:i<stripes?sc:'transparent',border:`1px solid ${i<stripes?sc:(belt==='White'?'#aaa':c.br)}`,opacity:i<stripes?1:0.2}}/>)}</div>}
    </div>
    {!kids&&<div style={{color:'#444',fontSize:11,fontFamily:F,fontWeight:700,letterSpacing:1}}>{stripes} of 4 stripes</div>}
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

export default function MemberPortal({initialMember,initialSessions,initialSchedule}){
  const router=useRouter();
  const [member,setMember]=useState(initialMember||{name:'Member',email:'',belt:'White',stripes:0,status:'inactive',joined_at:TODAYSTR,next_payment_date:TODAYSTR,avatar_color:'#3e1460'});
  const [sessions,setSessions]=useState(initialSessions||[]);
  const [view,setView]=useState('home');
  const [showLog,setShowLog]=useState(false);
  const [showEdit,setShowEdit]=useState(false);
  const [toast,setToast]=useState(null);
  const [logDate,setLogDate]=useState(TODAYSTR);
  const [logNote,setLogNote]=useState('');
  const [editForm,setEditForm]=useState({phone:'',home_phone:'',parent_name:'',address_line1:'',address_line2:'',city:'',state:'',zip:'',emergency_contact:'',avatar_color:''});
  const [expandedId,setExpandedId]=useState(null);
  const [saving,setSaving]=useState(false);
  const [community,setCommunity]=useState({topTrainers:[],recentPromos:[],loaded:false});
  const [showPromo,setShowPromo]=useState(false);
  const [promoConfirm,setPromoConfirm]=useState(false);
  const [promoBelt,setPromoBelt]=useState('');
  const [promoStripes,setPromoStripes]=useState(0);
  const [promoSaving,setPromoSaving]=useState(false);

  useEffect(()=>{
    async function loadCommunity(){
      const[{data:trainers},{data:promos}]=await Promise.all([
        supabase.from('members').select('id,name,belt,stripes,sessions').eq('status','active').order('sessions',{ascending:false}).limit(10),
        supabase.from('promotions').select('*').order('promoted_at',{ascending:false}).limit(8),
      ]);
      setCommunity({topTrainers:trainers||[],recentPromos:promos||[],loaded:true});
    }
    loadCommunity();
  },[]);

  const isKidsMember=member.date_of_birth?(()=>{const d=new Date(member.date_of_birth),now=new Date();let a=now.getFullYear()-d.getFullYear();if(now.getMonth()<d.getMonth()||(now.getMonth()===d.getMonth()&&now.getDate()<d.getDate()))a--;return a<16;})():false;
  const beltOrder=isKidsMember?KIDS_BELT_ORDER:ADULT_BELT_ORDER;
  function getPromoOptions(){
    const opts=[];const curBelt=member.belt||'White';const curIdx=beltOrder.indexOf(curBelt);const kids=isKidsBelt(curBelt);
    if(!kids)[1,2,3,4].forEach(s=>{if(s>=(member.stripes||0))opts.push({belt:curBelt,stripes:s,label:`${curBelt} Belt ${s} ${s===1?'Stripe':'Stripes'}`});});
    if(curIdx<beltOrder.length-1){const nb=beltOrder[curIdx+1];opts.push({belt:nb,stripes:0,label:`${nb} Belt`});}
    return opts;
  }

  const cnt=sessions.length,streak=computeStreak(sessions);
  const earned=MILES.filter(m=>cnt>=m.n),next=MILES.find(m=>cnt<m.n);
  const isOD=member.status==='overdue';

  function showT(msg){setToast(msg);setTimeout(()=>setToast(null),2800);}
  async function logSession(){
    if(sessions.find(s=>s.session_date===logDate)){showT('Already logged for that date.');setShowLog(false);return;}
    setSaving(true);
    const{data}=await supabase.from('sessions').insert({member_id:member.id,session_date:logDate,note:logNote}).select().single();
    if(data)setSessions(s=>[data,...s]);
    setLogNote('');setShowLog(false);setSaving(false);showT('Session logged!');
  }
  function openEdit(){setEditForm({phone:member.phone||'',home_phone:member.home_phone||'',parent_name:member.parent_name||'',address_line1:member.address_line1||'',address_line2:member.address_line2||'',city:member.city||'',state:member.state||'',zip:member.zip||'',emergency_contact:member.emergency_contact||'',avatar_color:member.avatar_color||'#3e1460'});setShowEdit(true);}
  async function saveProfile(){
    setSaving(true);
    await supabase.from('members').update({phone:editForm.phone,home_phone:editForm.home_phone,parent_name:editForm.parent_name,address_line1:editForm.address_line1,address_line2:editForm.address_line2,city:editForm.city,state:editForm.state,zip:editForm.zip,emergency_contact:editForm.emergency_contact,avatar_color:editForm.avatar_color}).eq('id',member.id);
    setMember(m=>({...m,...editForm}));setSaving(false);setShowEdit(false);showT('Profile updated.');
  }
  async function confirmPromotion(){
    if(!promoBelt)return;setPromoSaving(true);
    const ob=member.belt,os=member.stripes||0;
    await supabase.from('members').update({belt:promoBelt,stripes:promoStripes}).eq('id',member.id);
    await supabase.from('promotions').insert({member_id:member.id,member_name:member.name,old_belt:ob,old_stripes:os,new_belt:promoBelt,new_stripes:promoStripes,promoted_by:'self'});
    setMember(m=>({...m,belt:promoBelt,stripes:promoStripes}));
    setPromoSaving(false);setPromoConfirm(false);setShowPromo(false);showT('Rank updated! Congrats!');
  }
  async function signOut(){await supabase.auth.signOut();router.push('/login');}

  const navs=[{id:'home',l:'Home',icon:'⌂'},{id:'journal',l:'Journal',icon:'✎'},{id:'schedule',l:'Schedule',icon:'◷'},{id:'profile',l:'Profile',icon:'◉'}];

  return <div style={{minHeight:'100vh',background:BG,color:'#fff',fontFamily:FB}}>
    {toast&&<div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',background:'#1a1400',border:`1px solid ${G}`,borderRadius:20,padding:'11px 20px',color:G,fontSize:14,fontWeight:800,fontFamily:F,letterSpacing:1,zIndex:300,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,.5)'}}>{toast}</div>}

    <div style={{height:3,background:`linear-gradient(90deg,${G},${GD})`}}/>
    <div style={{background:SURF,borderBottom:`1px solid ${BL}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',height:60,position:'sticky',top:0,zIndex:40}}>
      <Logo/>
      <GBtn onClick={()=>setShowLog(true)} style={{fontSize:13,padding:'9px 18px'}}>+ Session</GBtn>
    </div>

    <div style={{padding:'20px',paddingBottom:100}}>

      {/* ---- HOME ---- */}
      {view==='home'&&<div>
        {isOD&&<div style={{background:'#1a0800',border:'1px solid #7a3300',borderRadius:10,padding:'14px 18px',marginBottom:14,color:ORG,fontSize:15,fontFamily:FB,fontWeight:600}}>Payment overdue — Contact your instructor.</div>}

        {/* Hero card */}
        <div style={{background:`linear-gradient(135deg,${CARD} 0%,${BELT_CFG[member.belt]?.gl?`rgba(0,0,0,0)`:CARD} 100%)`,border:`1px solid ${BL}`,borderRadius:12,marginBottom:14,overflow:'hidden',position:'relative'}}>
          <div style={{position:'absolute',top:0,right:0,width:120,height:120,background:BELT_CFG[member.belt]?.bg||'#111',opacity:.06,borderRadius:'0 12px 0 100%'}}/>
          <div style={{height:3,background:`linear-gradient(90deg,${G}80,transparent)`}}/>
          <div style={{padding:'22px 20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
              <div style={{width:58,height:58,borderRadius:10,background:member.avatar_color||GK,border:`2px solid ${G}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:G,fontFamily:F,letterSpacing:1.5,flexShrink:0}}>{ini(member.name)}</div>
              <div>
                <div style={{color:'#fff',fontSize:24,fontWeight:800,fontFamily:FB,lineHeight:1}}>{member.name}</div>
                <div style={{color:'#555',fontSize:12,marginTop:5,fontFamily:FB}}>Member since {member.joined_at?new Date(member.joined_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}):'—'}</div>
              </div>
            </div>
            <BeltBar belt={member.belt||'White'} stripes={member.stripes||0}/>
          </div>
        </div>

        {/* Promo button */}
        {getPromoOptions().length>0&&!showPromo&&<button onClick={()=>setShowPromo(true)} style={{width:'100%',padding:'11px',background:'transparent',border:`1px solid ${BL}`,borderRadius:8,color:GD,fontSize:12,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',marginBottom:14}}>Update My Rank</button>}
        {showPromo&&!promoConfirm&&<div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,padding:'18px',marginBottom:14}}>
          <SLabel>Update My Rank</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
            {getPromoOptions().map((opt,i)=><div key={i} onClick={()=>{setPromoBelt(opt.belt);setPromoStripes(opt.stripes);}} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:promoBelt===opt.belt&&promoStripes===opt.stripes?GK:SURF,border:`1px solid ${promoBelt===opt.belt&&promoStripes===opt.stripes?G:BL}`,borderRadius:8,cursor:'pointer'}}>
              <div style={{width:12,height:12,borderRadius:'50%',border:`2px solid ${promoBelt===opt.belt&&promoStripes===opt.stripes?G:'#444'}`,background:promoBelt===opt.belt&&promoStripes===opt.stripes?G:'transparent',flexShrink:0}}/>
              <span style={{color:'#fff',fontSize:15,fontFamily:FB,fontWeight:600}}>{opt.label}</span>
            </div>)}
          </div>
          <div style={{display:'flex',gap:8}}>
            <GhBtn onClick={()=>{setShowPromo(false);setPromoBelt('');setPromoStripes(0);}} style={{flex:1}}>Cancel</GhBtn>
            <GBtn onClick={()=>promoBelt&&setPromoConfirm(true)} style={{flex:2,opacity:promoBelt?1:0.4}}>Continue</GBtn>
          </div>
        </div>}
        {promoConfirm&&<div style={{background:'#0a1000',border:`1px solid ${G}40`,borderRadius:10,padding:'18px',marginBottom:14}}>
          <div style={{color:G,fontSize:16,fontWeight:800,fontFamily:F,letterSpacing:1,marginBottom:8}}>Confirm Rank Update</div>
          <div style={{color:'#888',fontSize:14,fontFamily:FB,lineHeight:1.6,marginBottom:14}}>You are updating to <strong style={{color:'#fff'}}>{promoBelt} Belt{!isKidsBelt(promoBelt)&&promoStripes>0?` ${promoStripes} ${promoStripes===1?'Stripe':'Stripes'}`:''}</strong>. This will be visible to the whole academy.</div>
          <div style={{display:'flex',gap:8}}>
            <GhBtn onClick={()=>setPromoConfirm(false)} style={{flex:1}}>Go Back</GhBtn>
            <GBtn onClick={confirmPromotion} style={{flex:2,opacity:promoSaving?.6:1}}>{promoSaving?'Saving...':'Yes, Update'}</GBtn>
          </div>
        </div>}

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
          {[{l:'Sessions',v:cnt,c:G},{l:'Streak',v:`${streak}d`,c:GRN},{l:'Status',v:isOD?'Overdue':'Paid Up',c:isOD?ORG:GRN}].map(s=><div key={s.l} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,padding:'14px 10px',textAlign:'center'}}>
            <div style={{color:'#444',fontSize:10,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F}}>{s.l}</div>
            <div style={{color:s.c,fontSize:28,fontWeight:900,fontFamily:FN,marginTop:5,lineHeight:1}}>{s.v}</div>
          </div>)}
        </div>

        {/* Next payment */}
        <Card><div style={{padding:'16px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{color:'#444',fontSize:11,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F}}>Next Payment</div>
            <div style={{color:isOD?ORG:'#fff',fontSize:18,fontWeight:700,fontFamily:FB,marginTop:4}}>{member.next_payment_date?fmtM(member.next_payment_date):'—'}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:isOD?ORG:GRN,boxShadow:isOD?`0 0 8px ${ORG}60`:`0 0 8px ${GRN}60`}}/>
            <span style={{color:isOD?ORG:GRN,fontSize:13,fontWeight:800,fontFamily:F,letterSpacing:.5}}>{isOD?'Overdue':'Paid Up'}</span>
          </div>
        </div></Card>

        {/* Milestone */}
        {next&&<Card><div style={{padding:'16px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div>
              <div style={{color:'#444',fontSize:11,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F,marginBottom:4}}>Next Milestone</div>
              <div style={{color:'#fff',fontSize:18,fontWeight:800,fontFamily:FB}}>{next.i} {next.l}</div>
            </div>
            <span style={{color:G,fontWeight:900,fontSize:15,fontFamily:FN}}>{cnt}/{next.n}</span>
          </div>
          <div style={{height:5,background:'#1a1a00',borderRadius:3}}><div style={{height:5,borderRadius:3,background:G,width:`${Math.min((cnt/next.n)*100,100)}%`,boxShadow:`0 0 8px ${G}60`}}/></div>
          <div style={{color:'#444',fontSize:12,marginTop:8,fontFamily:FB}}>{next.n-cnt} sessions to go</div>
        </div></Card>}

        {/* Badges */}
        {earned.length>0&&<Card><div style={{padding:'16px 18px'}}>
          <SLabel>Milestones Earned</SLabel>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{earned.map(m=><div key={m.n} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,background:SURF,border:`1px solid ${BL}`,borderRadius:8,padding:'14px 16px',minWidth:72}}>
            <span style={{fontSize:24}}>{m.i}</span>
            <span style={{color:G,fontSize:9,fontWeight:800,textAlign:'center',fontFamily:F,letterSpacing:1,textTransform:'uppercase'}}>{m.l}</span>
          </div>)}</div>
        </div></Card>}

        {/* Recent sessions */}
        <Card><div style={{padding:'16px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <SLabel>Recent Sessions</SLabel>
            <button onClick={()=>setView('journal')} style={{background:'none',border:'none',color:GD,fontSize:11,cursor:'pointer',fontFamily:F,letterSpacing:1,textTransform:'uppercase',fontWeight:800,padding:0}}>View All</button>
          </div>
          {sessions.slice(0,4).map(s=><div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${BL}`}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:G,flexShrink:0}}/>
            <span style={{color:'#888',fontSize:14,fontFamily:FB}}>{fmtS(s.session_date)}</span>
            {s.note&&<span style={{color:'#444',fontSize:13,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.note}</span>}
          </div>)}
          {sessions.length===0&&<div style={{color:'#333',fontSize:14,fontFamily:FB}}>No sessions yet. Log your first one!</div>}
        </div></Card>

        {/* Top Trainers */}
        <Card><div style={{padding:'16px 18px'}}>
          <SLabel>Top Trainers</SLabel>
          {!community.loaded&&<div style={{color:'#333',fontSize:14,fontFamily:FB}}>Loading...</div>}
          {community.topTrainers.map((t,i)=>{
            const maxS=community.topTrainers[0]?.sessions||1;
            const c=BELT_CFG[t.belt]||BELT_CFG.White;
            return <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{color:i===0?G:'#2a2200',fontWeight:900,fontSize:18,fontFamily:FN,width:22,textAlign:'center',flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                  <span style={{color:t.id===member.id?G:'#fff',fontSize:15,fontWeight:t.id===member.id?800:600,fontFamily:FB,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.id===member.id?'You':t.name}</span>
                  <span style={{padding:'1px 6px',background:c.bg,border:`1px solid ${c.br}`,borderRadius:3,fontSize:8,fontWeight:800,fontFamily:F,color:c.tx,letterSpacing:1,textTransform:'uppercase',flexShrink:0}}>{t.belt}</span>
                </div>
                <div style={{height:4,background:'#1a1a00',borderRadius:2}}><div style={{height:4,borderRadius:2,background:t.id===member.id?G:GD,width:`${((t.sessions||0)/maxS)*100}%`,opacity:t.id===member.id?1:0.5}}/></div>
              </div>
              <div style={{color:t.id===member.id?G:'#666',fontWeight:900,fontSize:15,fontFamily:FN,flexShrink:0,minWidth:28,textAlign:'right'}}>{t.sessions||0}</div>
            </div>;
          })}
          {community.loaded&&community.topTrainers.length===0&&<div style={{color:'#333',fontSize:14,fontFamily:FB}}>No data yet.</div>}
        </div></Card>

        {/* Recent promotions */}
        {community.recentPromos.length>0&&<Card><div style={{padding:'16px 18px'}}>
          <SLabel>Recent Promotions</SLabel>
          {community.recentPromos.map(p=>{
            const bc=b=>({White:'#e8e8e0',Grey:'#888',Yellow:'#c9a227',Orange:'#c97316',Green:'#2a6a2a',Blue:'#1a3a6e',Purple:'#3e1460',Brown:'#4a2000',Black:'#222'}[b]||'#444');
            const btx=b=>(['White','Yellow'].includes(b)?'#000':'#fff');
            const kids=b=>['Grey','Yellow','Orange','Green'].includes(b);
            const ago=d=>{const diff=Math.floor((new Date()-new Date(d))/86400000);return diff===0?'Today':diff===1?'Yesterday':`${diff}d ago`;};
            return <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${BL}`}}>
              <div style={{width:36,height:36,borderRadius:8,background:GK,border:`1.5px solid ${GD}`,display:'flex',alignItems:'center',justifyContent:'center',color:G,fontSize:11,fontWeight:800,fontFamily:F,flexShrink:0}}>{p.member_name?p.member_name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2):'?'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:'#fff',fontSize:14,fontWeight:700,fontFamily:FB,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.member_id===member.id?'You':p.member_name}</div>
                <div style={{display:'flex',alignItems:'center',gap:5,marginTop:4,flexWrap:'wrap'}}>
                  <span style={{padding:'2px 6px',background:bc(p.old_belt),borderRadius:3,fontSize:9,fontWeight:800,fontFamily:F,color:btx(p.old_belt),letterSpacing:1,textTransform:'uppercase'}}>{p.old_belt}{!kids(p.old_belt)&&p.old_stripes>0?` ${p.old_stripes}s`:''}</span>
                  <span style={{color:'#444',fontSize:12}}>→</span>
                  <span style={{padding:'2px 6px',background:bc(p.new_belt),borderRadius:3,fontSize:9,fontWeight:800,fontFamily:F,color:btx(p.new_belt),letterSpacing:1,textTransform:'uppercase'}}>{p.new_belt}{!kids(p.new_belt)&&p.new_stripes>0?` ${p.new_stripes}s`:''}</span>
                </div>
              </div>
              <div style={{color:'#333',fontSize:12,fontFamily:F,flexShrink:0}}>{ago(p.promoted_at)}</div>
            </div>;
          })}
        </div></Card>}
      </div>}

      {/* ---- JOURNAL ---- */}
      {view==='journal'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:18}}>
          <div>
            <div style={{fontWeight:800,fontSize:26,color:'#fff',fontFamily:FB}}>Training Journal</div>
            <div style={{color:'#555',fontSize:13,marginTop:3,fontFamily:FB}}>{cnt} sessions logged</div>
          </div>
          <GBtn onClick={()=>setShowLog(true)} style={{fontSize:12,padding:'9px 16px'}}>+ Log</GBtn>
        </div>
        <Card><div style={{padding:'8px 18px'}}>
          {[...sessions].sort((a,b)=>new Date(b.session_date)-new Date(a.session_date)).map(s=><div key={s.id} onClick={()=>s.note&&setExpandedId(expandedId===s.id?null:s.id)} style={{padding:'14px 0',borderBottom:`1px solid ${BL}`,cursor:s.note?'pointer':'default'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:G,flexShrink:0,boxShadow:`0 0 6px ${G}60`}}/>
                <span style={{color:'#fff',fontSize:15,fontWeight:700,fontFamily:FB}}>{fmtL(s.session_date)}</span>
              </div>
              {s.note&&<span style={{color:'#444',fontSize:18}}>›</span>}
            </div>
            {s.note&&expandedId!==s.id&&<div style={{color:'#444',fontSize:13,marginTop:6,paddingLeft:20,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontFamily:FB}}>{s.note}</div>}
            {s.note&&expandedId===s.id&&<div style={{color:'#888',fontSize:14,marginTop:10,paddingLeft:20,lineHeight:1.7,borderLeft:`2px solid ${BL}`,fontFamily:FB}}>{s.note}</div>}
          </div>)}
          {sessions.length===0&&<div style={{color:'#333',padding:'30px 0',fontFamily:FB,fontSize:15}}>No sessions yet.</div>}
        </div></Card>
      </div>}

      {/* ---- SCHEDULE ---- */}
      {view==='schedule'&&<div>
        <div style={{fontWeight:800,fontSize:26,color:'#fff',fontFamily:FB,marginBottom:18}}>Class Schedule</div>
        {DAYS.map((day,di)=>{
          const cls=(initialSchedule||[]).filter(c=>c.day_of_week===di).sort((a,b)=>a.start_time.localeCompare(b.start_time));
          return <div key={day} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:10,marginBottom:8,overflow:'hidden'}}>
            <div style={{display:'flex',gap:14,padding:'14px 18px',alignItems:cls.length?'flex-start':'center'}}>
              <div style={{width:48,height:48,borderRadius:8,background:cls.length?GK:'transparent',border:`1.5px solid ${cls.length?G:BL}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span style={{fontWeight:800,fontSize:11,fontFamily:F,letterSpacing:1,color:cls.length?G:'#333',textTransform:'uppercase'}}>{DAYSS[di]}</span>
                {cls.length>0&&<span style={{fontSize:9,color:GD,fontFamily:F,fontWeight:700}}>{cls.length}x</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                {cls.length===0?<span style={{color:'#333',fontSize:14,fontFamily:FB}}>Rest Day</span>
                :cls.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8,padding:'8px 10px',background:SURF,borderRadius:6}}>
                  <span style={{color:G,fontSize:16,fontWeight:900,fontFamily:FN,flexShrink:0}}>{c.start_time.slice(0,5)}</span>
                  <span style={{color:'#fff',fontSize:14,fontWeight:600,fontFamily:FB}}>{c.class_name}</span>
                  <TPill type={c.type}/>
                  {c.instructor&&<span style={{color:'#555',fontSize:13,fontFamily:FB}}>{c.instructor}</span>}
                </div>)}
              </div>
            </div>
          </div>;
        })}
      </div>}

      {/* ---- PROFILE ---- */}
      {view==='profile'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontWeight:800,fontSize:26,color:'#fff',fontFamily:FB}}>My Profile</div>
          <GhBtn onClick={openEdit}>Edit</GhBtn>
        </div>
        <Card><div style={{padding:'20px 18px',display:'flex',alignItems:'flex-start',gap:14}}>
          <div style={{width:58,height:58,borderRadius:10,background:member.avatar_color||GK,border:`2px solid ${G}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:G,fontFamily:F,letterSpacing:1.5,flexShrink:0}}>{ini(member.name)}</div>
          <div style={{flex:1}}>
            <div style={{color:'#fff',fontSize:20,fontWeight:800,fontFamily:FB}}>{member.name}</div>
            <div style={{color:'#555',fontSize:13,marginTop:2,fontFamily:FB}}>{member.email}</div>
            {member.date_of_birth&&<div style={{color:'#555',fontSize:13,marginTop:1,fontFamily:FB}}>DOB: {new Date(member.date_of_birth).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>}
            {member.gender&&member.gender!=='-- Select --'&&<div style={{color:'#555',fontSize:13,marginTop:1,fontFamily:FB}}>{member.gender}</div>}
            <div style={{marginTop:12}}><BeltBar belt={member.belt||'White'} stripes={member.stripes||0}/></div>
          </div>
        </div></Card>

        <Card><div style={{padding:'16px 18px'}}>
          <SLabel>Contact</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[{i:'📱',l:'Cell Phone',v:member.phone},{i:'🏠',l:'Home Phone',v:member.home_phone},{i:'👨‍👩‍👧',l:'Parent/Guardian',v:member.parent_name}].map(f=>f.v&&<div key={f.l} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{f.i}</span>
              <div><div style={{color:'#444',fontSize:10,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F,marginBottom:2}}>{f.l}</div><div style={{color:'#fff',fontSize:15,fontFamily:FB}}>{f.v}</div></div>
            </div>)}
          </div>
        </div></Card>

        {(member.address_line1||member.city)&&<Card><div style={{padding:'16px 18px'}}>
          <SLabel>Address</SLabel>
          <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>📍</span>
            <div style={{color:'#fff',fontSize:15,fontFamily:FB,lineHeight:1.7}}>
              {member.address_line1&&<div>{member.address_line1}</div>}
              {member.address_line2&&<div>{member.address_line2}</div>}
              {(member.city||member.state)&&<div>{[member.city,member.state,member.zip].filter(Boolean).join(', ')}</div>}
            </div>
          </div>
        </div></Card>}

        <Card><div style={{padding:'16px 18px'}}>
          <SLabel>Emergency Contact</SLabel>
          <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>🚨</span>
            <div style={{color:member.emergency_contact?'#fff':'#333',fontSize:15,fontFamily:FB}}>{member.emergency_contact||'Not set'}</div>
          </div>
        </div></Card>

        {(member.martial_arts_experience||member.physical_limitations||member.allergies_medications||member.height_weight)&&<Card><div style={{padding:'16px 18px'}}>
          <SLabel>Training Info</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {[{l:'Martial Arts Experience',v:member.martial_arts_experience},{l:'Physical Limitations',v:member.physical_limitations},{l:'Allergies / Medications',v:member.allergies_medications},{l:'Height / Weight',v:member.height_weight}].map(f=>f.v&&<div key={f.l}>
              <div style={{color:'#444',fontSize:10,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F,marginBottom:3}}>{f.l}</div>
              <div style={{color:'#888',fontSize:14,fontFamily:FB,lineHeight:1.5}}>{f.v}</div>
            </div>)}
          </div>
        </div></Card>}

        <Card><div style={{padding:'16px 18px'}}>
          <SLabel>Membership</SLabel>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:member.waiver_signed_at?12:0}}>
            <div><div style={{color:'#444',fontSize:10,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F,marginBottom:3}}>Joined</div><div style={{color:'#fff',fontSize:15,fontWeight:700,fontFamily:FB}}>{member.joined_at?fmtM(member.joined_at):'—'}</div></div>
            <div style={{textAlign:'right'}}><div style={{color:'#444',fontSize:10,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F,marginBottom:3}}>Next Billing</div><div style={{color:isOD?ORG:GRN,fontSize:15,fontWeight:700,fontFamily:FB}}>{member.next_payment_date?fmtM(member.next_payment_date):'—'}</div></div>
          </div>
          {member.waiver_signed_at&&<div style={{paddingTop:12,borderTop:`1px solid ${BL}`}}>
            <div style={{color:'#444',fontSize:10,textTransform:'uppercase',letterSpacing:1.5,fontWeight:700,fontFamily:F,marginBottom:3}}>Waiver Signed</div>
            <div style={{color:'#555',fontSize:14,fontFamily:FB}}>{new Date(member.waiver_signed_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}{member.waiver_signed_by&&member.waiver_signed_by!==member.name?` by ${member.waiver_signed_by}`:''}</div>
          </div>}
        </div></Card>

        <button onClick={signOut} style={{width:'100%',padding:14,background:'transparent',border:`1px solid ${BL}`,borderRadius:8,color:'#444',fontSize:12,fontFamily:F,letterSpacing:2,textTransform:'uppercase',cursor:'pointer',marginTop:4}}>Sign Out</button>
      </div>}
    </div>

    {/* Bottom nav */}
    <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#0a0a08',borderTop:`1px solid ${BL}`,display:'flex',zIndex:50,paddingBottom:'env(safe-area-inset-bottom)'}}>
      {navs.map(n=>{
        const active=view===n.id;
        return <button key={n.id} onClick={()=>setView(n.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'10px 4px 8px',background:'transparent',border:'none',cursor:'pointer',gap:3,position:'relative'}}>
          {active&&<div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:24,height:3,background:G,borderRadius:'0 0 3px 3px'}}/>}
          <span style={{fontSize:20,lineHeight:1,color:active?G:'#555'}}>{n.icon}</span>
          <span style={{fontSize:9,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',color:active?G:'#444'}}>{n.l}</span>
        </button>;
      })}
    </div>
    <div style={{height:80}}/>

    <Modal open={showLog} onClose={()=>setShowLog(false)} title="Log Session">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div><FL>Date</FL><input type="date" value={logDate} max={TODAYSTR} onChange={e=>setLogDate(e.target.value)} style={inpStyle}/></div>
        <div><FL>Journal Note <span style={{color:'#333',fontWeight:400}}>(optional)</span></FL><textarea value={logNote} onChange={e=>setLogNote(e.target.value)} rows={3} placeholder="What did you work on?" style={{...inpStyle,resize:'vertical',minHeight:80}}/></div>
        <div style={{display:'flex',gap:10,marginTop:4}}>
          <GhBtn onClick={()=>setShowLog(false)} style={{flex:1}}>Cancel</GhBtn>
          <GBtn onClick={logSession} style={{flex:2,opacity:saving?.6:1}}>{saving?'Saving...':'Log It'}</GBtn>
        </div>
      </div>
    </Modal>

    <Modal open={showEdit} onClose={()=>setShowEdit(false)} title="Edit Profile">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {[{k:'phone',l:'Cell Phone',p:'802-555-0000'},{k:'home_phone',l:'Home Phone',p:'802-555-0000'},{k:'parent_name',l:'Parent/Guardian',p:'Parent name'},{k:'emergency_contact',l:'Emergency Contact',p:'Name - Phone'}].map(f=><div key={f.k}><FL>{f.l}</FL><input value={editForm[f.k]} onChange={e=>setEditForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p} style={inpStyle}/></div>)}
        <div><FL>Address</FL><input value={editForm.address_line1} onChange={e=>setEditForm(p=>({...p,address_line1:e.target.value}))} placeholder="338 Dorset St" style={inpStyle}/></div>
        <div style={{display:'flex',gap:8}}>
          <div style={{flex:2}}><FL>City</FL><input value={editForm.city} onChange={e=>setEditForm(p=>({...p,city:e.target.value}))} placeholder="S. Burlington" style={inpStyle}/></div>
          <div style={{flex:1}}><FL>State</FL><input value={editForm.state} onChange={e=>setEditForm(p=>({...p,state:e.target.value}))} placeholder="VT" style={inpStyle}/></div>
          <div style={{flex:1}}><FL>ZIP</FL><input value={editForm.zip} onChange={e=>setEditForm(p=>({...p,zip:e.target.value}))} placeholder="05403" style={inpStyle}/></div>
        </div>
        <div><FL>Avatar Color</FL><div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:4}}>{AV_COLORS.map(c=><div key={c} onClick={()=>setEditForm(f=>({...f,avatar_color:c}))} style={{width:34,height:34,borderRadius:6,background:c,cursor:'pointer',border:editForm.avatar_color===c?`2px solid ${G}`:'2px solid transparent',boxSizing:'border-box'}}/>)}</div></div>
        <div style={{display:'flex',gap:10,marginTop:4}}>
          <GhBtn onClick={()=>setShowEdit(false)} style={{flex:1}}>Cancel</GhBtn>
          <GBtn onClick={saveProfile} style={{flex:2,opacity:saving?.6:1}}>{saving?'Saving...':'Save'}</GBtn>
        </div>
      </div>
    </Modal>
  </div>;
}
