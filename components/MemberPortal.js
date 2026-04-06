'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const G='#c9a227',GD='#8a6e18',GK='#1a1600',BG='#060606',CARD='#0d0d0b',BL='#2e2600',GRN='#4a9e4a',ORG='#c97316';
const F="'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FB="'Barlow','Arial Narrow',Arial,sans-serif";
const BELT_CFG={White:{bg:'#e8e8e0',tx:'#111',br:'#bbb',gl:'rgba(220,220,210,.08)'},Blue:{bg:'#1a3a6e',tx:'#fff',br:'#2a5aae',gl:'rgba(42,90,174,.15)'},Purple:{bg:'#3e1460',tx:'#fff',br:'#6a2aaa',gl:'rgba(106,42,170,.18)'},Brown:{bg:'#4a2000',tx:'#fff',br:'#7a3e10',gl:'rgba(122,62,16,.15)'},Black:{bg:'#0a0a0a',tx:'#fff',br:'#3a3a3a',gl:'rgba(255,255,255,.04)'},Grey:{bg:'#888',tx:'#fff',br:'#aaa',gl:'rgba(150,150,150,.08)'},Yellow:{bg:'#c9a227',tx:'#000',br:'#a07800',gl:'rgba(200,160,40,.12)'},Orange:{bg:'#c97316',tx:'#fff',br:'#a05010',gl:'rgba(200,115,22,.12)'},Green:{bg:'#2a6a2a',tx:'#fff',br:'#1a4a1a',gl:'rgba(42,106,42,.12)'}};
const TYPE_CFG={'Gi':{bg:'#1a3a6e',br:'#2a5aae'},'No-Gi':{bg:'#4a1a1a',br:'#8a2a2a'},Wrestling:{bg:'#1a3a1a',br:'#2a6a2a'},Judo:{bg:'#3a1a00',br:'#7a4a00'},'Open Mat':{bg:'#1a1a3a',br:'#3a3a8a'},Other:{bg:'#222',br:'#444'}};
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYSS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MILES=[{n:10,l:'First 10',i:'🥋'},{n:50,l:'50 Sessions',i:'⚡'},{n:100,l:'Century',i:'💯'},{n:200,l:'Dedicated',i:'🔥'},{n:365,l:'Year on the Mat',i:'📅'},{n:500,l:'500 Club',i:'🏆'}];
const AV_COLORS=['#3e1460','#1a3a6e','#c9a227','#4a2000','#0a3a0a','#3a0a0a','#222','#1a2a3a'];
const TODAY=new Date(),TODAYSTR=TODAY.toISOString().split('T')[0];
const ini=n=>n?n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2):'?';
const fmtL=d=>new Date(d).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric',year:'numeric'});
const fmtS=d=>new Date(d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
const fmtM=d=>new Date(d).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

function computeStreak(sessions){
  if(!sessions.length)return 0;
  const s=[...sessions].sort((a,b)=>new Date(b.session_date)-new Date(a.session_date));
  let st=0,cur=new Date(TODAY);
  for(const x of s){const d=new Date(x.session_date);if(Math.round((cur-d)/86400000)<=2){st++;cur=d;}else break;}
  return st;
}

function Card({children,style={}}){return <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:5,marginBottom:10,overflow:'hidden',...style}}>{children}</div>}
function SLabel({children}){return <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><div style={{width:12,height:1,background:G,opacity:.5}}/><span style={{color:GD,fontSize:9,fontWeight:800,letterSpacing:2,textTransform:'uppercase',fontFamily:F}}>{children}</span><div style={{flex:1,height:1,background:BL}}/></div>}
function GBtn({children,onClick,style={}}){return <button onClick={onClick} style={{padding:'9px 18px',background:G,border:'none',borderRadius:3,color:'#000',fontWeight:800,fontSize:12,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',...style}}>{children}</button>}
function GhBtn({children,onClick,style={}}){return <button onClick={onClick} style={{padding:'7px 14px',background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:'#555',fontSize:11,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',...style}}>{children}</button>}
function TPill({type}){const c=TYPE_CFG[type]||TYPE_CFG.Other;return <span style={{padding:'2px 7px',background:c.bg,border:`1px solid ${c.br}`,borderRadius:2,fontSize:9,fontWeight:800,fontFamily:F,color:'#fff',letterSpacing:1,textTransform:'uppercase'}}>{type}</span>}
const KIDS_BELTS=['White','Grey','Yellow','Orange','Green'];
const isKidsBelt=b=>KIDS_BELTS.includes(b);
function BeltBar({belt,stripes}){
  const c=BELT_CFG[belt]||BELT_CFG.White,sc=belt==='White'?'#111':'#fff';
  const kids=isKidsBelt(belt);
  return <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
    <div style={{width:kids?140:180,height:28,background:c.bg,border:`2px solid ${c.br}`,borderRadius:3,display:'flex',alignItems:'center',justifyContent:kids?'center':'space-between',padding:'0 10px',boxShadow:`0 0 24px ${c.gl}`}}>
      <span style={{fontSize:11,fontWeight:800,fontFamily:F,color:c.tx,letterSpacing:2,textTransform:'uppercase'}}>{belt} Belt</span>
      {!kids&&<div style={{display:'flex',gap:3}}>{[0,1,2,3,4].map(i=><div key={i} style={{width:8,height:20,borderRadius:2,background:i<stripes?sc:'transparent',border:`1px solid ${i<stripes?sc:(belt==='White'?'#aaa':c.br)}`,opacity:i<stripes?1:0.25}}/>)}</div>}
    </div>
    {!kids&&<div style={{color:'#3a3200',fontSize:10,fontFamily:F,fontWeight:700,letterSpacing:1}}>{stripes} of 4 stripes</div>}
  </div>;
}
function Modal({open,onClose,title,children}){if(!open)return null;return <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.92)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}><div style={{background:'#0a0a0a',border:`1px solid ${BL}`,borderRadius:6,width:'100%',maxWidth:420,maxHeight:'90vh',overflowY:'auto'}}><div style={{height:3,background:G,opacity:.85}}/><div style={{padding:24}}><div style={{fontWeight:800,fontSize:18,letterSpacing:2,color:'#fff',textTransform:'uppercase',marginBottom:20,fontFamily:F}}>{title}</div>{children}</div></div></div>}
function FL({children}){return <div style={{color:GD,fontSize:10,letterSpacing:1.5,textTransform:'uppercase',marginBottom:6,fontWeight:800,fontFamily:F}}>{children}</div>}

function Logo(){
  return <div style={{display:'flex',alignItems:'center',gap:10}}>
    <div style={{position:'relative',width:48,height:36,flexShrink:0}}>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',gap:2,paddingTop:2}}>{[0,1,2,3,4,5].map(i=><div key={i} style={{height:4,background:G,opacity:i%2===0?1:0.15,borderRadius:1}}/>)}</div>
      <div style={{position:'absolute',top:2,left:2,width:18,height:18,background:G,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:7,fontWeight:900,color:'#000',fontFamily:F}}>★★</span></div>
    </div>
    <div>
      <div style={{fontWeight:800,fontSize:16,letterSpacing:2,color:G,textTransform:'uppercase',fontFamily:F,lineHeight:1}}>High Hat</div>
      <div style={{fontSize:8,color:'#555',letterSpacing:1.5,textTransform:'uppercase',fontFamily:F,lineHeight:1.4}}>American Jiu Jitsu</div>
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
  const [editForm,setEditForm]=useState({phone:'',address:'',emergency_contact:'',avatar_color:''});
  const [expandedId,setExpandedId]=useState(null);
  const [saving,setSaving]=useState(false);

  const [showPromo,setShowPromo]=useState(false);
  const [promoConfirm,setPromoConfirm]=useState(false);
  const [promoBelt,setPromoBelt]=useState('');
  const [promoStripes,setPromoStripes]=useState(0);
  const [promoSaving,setPromoSaving]=useState(false);

  const ADULT_BELT_ORDER=['White','Blue','Purple','Brown','Black'];
  const KIDS_BELT_ORDER=['White','Grey','Yellow','Orange','Green'];
  const isKidsMember=member.date_of_birth?(()=>{const d=new Date(member.date_of_birth),now=new Date();let a=now.getFullYear()-d.getFullYear();if(now.getMonth()<d.getMonth()||(now.getMonth()===d.getMonth()&&now.getDate()<d.getDate()))a--;return a<16;})():false;
  const beltOrder=isKidsMember?KIDS_BELT_ORDER:ADULT_BELT_ORDER;
  const currentBeltIdx=beltOrder.indexOf(member.belt||'White');
  const isKidsBelt=b=>['Grey','Yellow','Orange','Green'].includes(b);

  // Allowed options: same belt any stripes, or one belt up 0 stripes
  function getPromoOptions(){
    const opts=[];
    const curBelt=member.belt||'White';
    const curIdx=beltOrder.indexOf(curBelt);
    const kids=isKidsBelt(curBelt);
    // Stripes on current belt
    if(!kids){
      [1,2,3,4].forEach(s=>{
        if(s>=(member.stripes||0))opts.push({belt:curBelt,stripes:s,label:`${curBelt} Belt ${s} ${s===1?'Stripe':'Stripes'}`});
      });
    }
    // One belt up
    if(curIdx<beltOrder.length-1){
      const nextBelt=beltOrder[curIdx+1];
      opts.push({belt:nextBelt,stripes:0,label:`${nextBelt} Belt`});
    }
    return opts;
  }

  async function confirmPromotion(){
    if(!promoBelt)return;
    setPromoSaving(true);
    const oldBelt=member.belt,oldStripes=member.stripes||0;
    await supabase.from('members').update({belt:promoBelt,stripes:promoStripes}).eq('id',member.id);
    await supabase.from('promotions').insert({
      member_id:member.id,member_name:member.name,
      old_belt:oldBelt,old_stripes:oldStripes,
      new_belt:promoBelt,new_stripes:promoStripes,
      promoted_by:'self',
    });
    setMember(m=>({...m,belt:promoBelt,stripes:promoStripes}));
    setPromoSaving(false);setPromoConfirm(false);setShowPromo(false);
    showT('Rank updated! Congrats!');
  }

  const [community,setCommunity]=useState({topTrainers:[],recentPromos:[],loaded:false});

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

  const cnt=sessions.length,streak=computeStreak(sessions);
  const earned=MILES.filter(m=>cnt>=m.n),next=MILES.find(m=>cnt<m.n);
  const isOD=member.status==='overdue';

  function showT(msg){setToast(msg);setTimeout(()=>setToast(null),2800);}

  async function logSession(){
    if(sessions.find(s=>s.session_date===logDate)){showT('Already logged for that date.');setShowLog(false);return;}
    setSaving(true);
    const{data}=await supabase.from('sessions').insert({member_id:member.id,session_date:logDate,note:logNote}).select().single();
    if(data)setSessions(s=>[data,...s]);
    setLogNote('');setShowLog(false);setSaving(false);showT('Session logged.');
  }

  function openEdit(){setEditForm({phone:member.phone||'',address:member.address||'',emergency_contact:member.emergency_contact||'',avatar_color:member.avatar_color||'#3e1460'});setShowEdit(true);}

  async function saveProfile(){
    setSaving(true);
    await supabase.from('members').update({phone:editForm.phone,address:editForm.address,emergency_contact:editForm.emergency_contact,avatar_color:editForm.avatar_color}).eq('id',member.id);
    setMember(m=>({...m,...editForm}));
    setSaving(false);setShowEdit(false);showT('Profile updated.');
  }

  async function signOut(){await supabase.auth.signOut();router.push('/login');}

  const navs=[{id:'home',l:'Home'},{id:'journal',l:'Journal'},{id:'schedule',l:'Schedule'},{id:'profile',l:'Profile'}];

  return <div style={{minHeight:'100vh',background:BG,color:'#fff',fontFamily:FB,paddingBottom:20}}>
    {toast&&<div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',background:'#1a1600',border:`1px solid ${GD}`,borderRadius:4,padding:'11px 18px',color:G,fontSize:13,fontWeight:800,fontFamily:F,letterSpacing:1,zIndex:300,whiteSpace:'nowrap'}}>{toast}</div>}
    <div style={{height:3,background:G}}/>
    <div style={{background:BG,borderBottom:`1px solid ${BL}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',height:58,position:'sticky',top:0,zIndex:40,flexWrap:'wrap',gap:8}}>
      <Logo/>
      <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>{navs.map(n=><button key={n.id} onClick={()=>setView(n.id)} style={{padding:'6px 10px',background:view===n.id?G:'transparent',border:view===n.id?'none':`1px solid ${BL}`,borderRadius:3,color:view===n.id?'#000':'#555',fontSize:10,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>{n.l}</button>)}</div>
      <GBtn onClick={()=>setShowLog(true)} style={{fontSize:11,padding:'7px 12px'}}>+ Session</GBtn>
    </div>

    <div style={{padding:'16px'}}>
      {view==='home'&&<div>
        {isOD&&<div style={{background:'#120700',border:'1px solid #7a3300',borderRadius:4,padding:'14px 16px',marginBottom:10,color:ORG,fontSize:14,fontFamily:F,fontWeight:700}}>Payment Overdue — Contact the gym.</div>}
        <Card style={{background:`radial-gradient(ellipse at 90% 0%,${BELT_CFG[member.belt]?.gl||'transparent'} 0%,${CARD} 55%)`}}>
          <div style={{height:3,background:G,opacity:.7}}/>
          <div style={{padding:'20px 18px'}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
              <div style={{width:52,height:52,borderRadius:3,background:member.avatar_color||'#3e1460',border:`2px solid ${G}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:G,fontFamily:F,letterSpacing:1.5,flexShrink:0}}>{ini(member.name)}</div>
              <div><div style={{color:'#fff',fontSize:20,fontWeight:800,fontFamily:F,letterSpacing:1,lineHeight:1}}>{member.name}</div><div style={{color:'#3a3200',fontSize:10,marginTop:5,fontFamily:F,letterSpacing:1}}>Member since {member.joined_at?new Date(member.joined_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}):'—'}</div></div>
            </div>
            <BeltBar belt={member.belt||'White'} stripes={member.stripes||0}/>
          </div>
        </Card>
        {/* Self-promotion button */}
        {getPromoOptions().length>0&&!showPromo&&(
          <button onClick={()=>setShowPromo(true)} style={{width:'100%',padding:'10px',background:'transparent',border:`1px solid ${BL}`,borderRadius:4,color:GD,fontSize:11,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',marginBottom:10}}>Update My Rank</button>
        )}
        {showPromo&&!promoConfirm&&(
          <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:5,padding:'16px',marginBottom:10}}>
            <SLabel>Update My Rank</SLabel>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
              {getPromoOptions().map((opt,i)=>(
                <div key={i} onClick={()=>{setPromoBelt(opt.belt);setPromoStripes(opt.stripes);}} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:promoBelt===opt.belt&&promoStripes===opt.stripes?'#1a1600':'#111',border:`1px solid ${promoBelt===opt.belt&&promoStripes===opt.stripes?G:BL}`,borderRadius:3,cursor:'pointer'}}>
                  <div style={{width:10,height:10,borderRadius:'50%',border:`2px solid ${promoBelt===opt.belt&&promoStripes===opt.stripes?G:'#444'}`,background:promoBelt===opt.belt&&promoStripes===opt.stripes?G:'transparent',flexShrink:0}}/>
                  <span style={{color:'#fff',fontSize:13,fontFamily:F,fontWeight:700}}>{opt.label}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{setShowPromo(false);setPromoBelt('');setPromoStripes(0);}} style={{flex:1,padding:'9px',background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:'#555',fontSize:11,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>Cancel</button>
              <button onClick={()=>promoBelt&&setPromoConfirm(true)} disabled={!promoBelt} style={{flex:2,padding:'9px',background:G,border:'none',borderRadius:3,color:'#000',fontSize:12,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',opacity:promoBelt?1:0.4}}>Continue</button>
            </div>
          </div>
        )}
        {promoConfirm&&(
          <div style={{background:'#0a1000',border:`1px solid ${G}`,borderRadius:5,padding:'16px',marginBottom:10}}>
            <div style={{color:G,fontSize:14,fontWeight:800,fontFamily:F,letterSpacing:1,marginBottom:8}}>Confirm Rank Update</div>
            <div style={{color:'#888',fontSize:13,fontFamily:FB,lineHeight:1.6,marginBottom:12}}>
              You are updating your rank to <strong style={{color:'#fff'}}>{promoBelt} Belt{!isKidsBelt(promoBelt)&&promoStripes>0?` ${promoStripes} ${promoStripes===1?'Stripe':'Stripes'}`:''}</strong>. This will be visible to the whole academy. Are you sure?
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setPromoConfirm(false)} style={{flex:1,padding:'9px',background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:'#555',fontSize:11,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>Go Back</button>
              <button onClick={confirmPromotion} disabled={promoSaving} style={{flex:2,padding:'9px',background:G,border:'none',borderRadius:3,color:'#000',fontSize:12,fontWeight:800,fontFamily:F,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',opacity:promoSaving?.6:1}}>{promoSaving?'Saving...':'Yes, Update Rank'}</button>
            </div>
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
          {[{l:'Sessions',v:cnt,c:G},{l:'Streak',v:`${streak}d`,c:GRN},{l:'Status',v:isOD?'Overdue':'Paid Up',c:isOD?ORG:GRN}].map(s=><div key={s.l} style={{background:CARD,border:`1px solid ${BL}`,borderRadius:4,padding:'12px 8px',textAlign:'center'}}><div style={{color:'#2e2800',fontSize:9,textTransform:'uppercase',letterSpacing:1.5,fontWeight:800,fontFamily:F}}>{s.l}</div><div style={{color:s.c,fontSize:24,fontWeight:800,fontFamily:F,marginTop:4}}>{s.v}</div></div>)}
        </div>
        <Card><div style={{padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div><div style={{color:'#2e2800',fontSize:9,textTransform:'uppercase',letterSpacing:1.5,fontWeight:800,fontFamily:F}}>Next Payment</div><div style={{color:isOD?ORG:'#fff',fontSize:16,fontWeight:800,fontFamily:F,marginTop:4}}>{member.next_payment_date?fmtM(member.next_payment_date):'—'}</div></div>
          <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:7,height:7,borderRadius:'50%',background:isOD?ORG:GRN}}/><span style={{color:isOD?ORG:GRN,fontSize:12,fontWeight:800,fontFamily:F,letterSpacing:1}}>{isOD?'Overdue':'Paid Up'}</span></div>
        </div></Card>
        {next&&<Card><div style={{padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div><div style={{color:'#2e2800',fontSize:9,textTransform:'uppercase',letterSpacing:1.5,fontWeight:800,fontFamily:F,marginBottom:4}}>Next Milestone</div><div style={{color:'#fff',fontSize:16,fontWeight:800,fontFamily:F}}>{next.i} {next.l}</div></div>
            <span style={{color:G,fontWeight:800,fontSize:13,fontFamily:F}}>{cnt}/{next.n}</span>
          </div>
          <div style={{height:4,background:'#111',borderRadius:2}}><div style={{height:4,borderRadius:2,background:G,width:`${Math.min((cnt/next.n)*100,100)}%`}}/></div>
          <div style={{color:'#2a2200',fontSize:11,marginTop:8,fontFamily:F}}>{next.n-cnt} sessions to go</div>
        </div></Card>}
        {earned.length>0&&<Card><div style={{padding:'14px 16px'}}><SLabel>Earned</SLabel><div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{earned.map(m=><div key={m.n} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'12px 14px',minWidth:70}}><span style={{fontSize:22}}>{m.i}</span><span style={{color:G,fontSize:9,fontWeight:800,textAlign:'center',fontFamily:F,letterSpacing:1,textTransform:'uppercase'}}>{m.l}</span></div>)}</div></div></Card>}
        <Card><div style={{padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><SLabel>Recent Sessions</SLabel><button onClick={()=>setView('journal')} style={{background:'none',border:'none',color:GD,fontSize:10,cursor:'pointer',fontFamily:F,letterSpacing:1,textTransform:'uppercase',fontWeight:800,padding:0,marginLeft:10}}>View All</button></div>
          {sessions.slice(0,4).map(s=><div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:`1px solid ${BL}`}}><div style={{width:5,height:5,borderRadius:'50%',background:G,flexShrink:0}}/><span style={{color:'#555',fontSize:13,fontFamily:F}}>{fmtS(s.session_date)}</span>{s.note&&<span style={{color:'#2a2a2a',fontSize:12,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.note}</span>}</div>)}
          {sessions.length===0&&<div style={{color:'#2a2a2a',fontSize:13,fontFamily:F}}>No sessions yet.</div>}
        </div></Card>

        {/* Top Trainers */}
        <Card>
          <div style={{padding:'14px 16px'}}>
            <SLabel>Top Trainers</SLabel>
            {!community.loaded&&<div style={{color:'#2a2a2a',fontSize:13,fontFamily:F}}>Loading...</div>}
            {community.topTrainers.map((t,i)=>{
              const maxS=community.topTrainers[0]?.sessions||1;
              const c=BELT_CFG[t.belt]||BELT_CFG.White;
              return <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{color:i===0?G:'#2a2200',fontWeight:800,fontSize:16,fontFamily:F,width:20,textAlign:'center',flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{color:t.id===member.id?G:'#fff',fontSize:13,fontWeight:700,fontFamily:F,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.id===member.id?'You':t.name}</span>
                    <span style={{padding:'1px 5px',background:c.bg,border:`1px solid ${c.br}`,borderRadius:2,fontSize:8,fontWeight:800,fontFamily:F,color:c.tx,letterSpacing:1,textTransform:'uppercase',flexShrink:0}}>{t.belt}</span>
                  </div>
                  <div style={{height:3,background:'#161600',borderRadius:1}}><div style={{height:3,borderRadius:1,background:t.id===member.id?G:GD,width:`${((t.sessions||0)/maxS)*100}%`,opacity:t.id===member.id?1:0.6}}/></div>
                </div>
                <div style={{color:t.id===member.id?G:'#555',fontWeight:800,fontSize:14,fontFamily:F,flexShrink:0,minWidth:28,textAlign:'right'}}>{t.sessions||0}</div>
              </div>;
            })}
            {community.loaded&&community.topTrainers.length===0&&<div style={{color:'#2a2a2a',fontSize:13,fontFamily:F}}>No data yet.</div>}
          </div>
        </Card>

        {/* Recent Promotions */}
        {community.recentPromos.length>0&&<Card>
          <div style={{padding:'14px 16px'}}>
            <SLabel>Recent Promotions</SLabel>
            {community.recentPromos.map(p=>{
              const bc=b=>({White:'#e8e8e0',Grey:'#888',Yellow:'#c9a227',Orange:'#c97316',Green:'#2a6a2a',Blue:'#1a3a6e',Purple:'#3e1460',Brown:'#4a2000',Black:'#222'}[b]||'#444');
              const btx=b=>(['White','Yellow'].includes(b)?'#000':'#fff');
              const kids=b=>['Grey','Yellow','Orange','Green'].includes(b);
              const fmtD=d=>{const diff=Math.floor((new Date()-new Date(d))/86400000);return diff===0?'Today':diff===1?'Yesterday':`${diff}d ago`;};
              return <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:`1px solid ${BL}`}}>
                <div style={{width:32,height:32,borderRadius:3,background:'#141400',border:`1.5px solid ${GD}`,display:'flex',alignItems:'center',justifyContent:'center',color:G,fontSize:10,fontWeight:800,fontFamily:F,flexShrink:0}}>{p.member_name?p.member_name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2):'?'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:'#fff',fontSize:13,fontWeight:700,fontFamily:F,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.member_id===member.id?'You':p.member_name}</div>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginTop:3,flexWrap:'wrap'}}>
                    <span style={{padding:'1px 5px',background:bc(p.old_belt),borderRadius:2,fontSize:8,fontWeight:800,fontFamily:F,color:btx(p.old_belt),letterSpacing:1,textTransform:'uppercase'}}>{p.old_belt}{!kids(p.old_belt)&&p.old_stripes>0?` ${p.old_stripes}s`:''}</span>
                    <span style={{color:'#333',fontSize:11}}>→</span>
                    <span style={{padding:'1px 5px',background:bc(p.new_belt),borderRadius:2,fontSize:8,fontWeight:800,fontFamily:F,color:btx(p.new_belt),letterSpacing:1,textTransform:'uppercase'}}>{p.new_belt}{!kids(p.new_belt)&&p.new_stripes>0?` ${p.new_stripes}s`:''}</span>
                  </div>
                </div>
                <div style={{color:'#333',fontSize:11,fontFamily:F,flexShrink:0}}>{fmtD(p.promoted_at)}</div>
              </div>;
            })}
          </div>
        </Card>}

      </div>}

      {view==='journal'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:18}}>
          <div><div style={{fontWeight:800,fontSize:22,letterSpacing:2,color:G,textTransform:'uppercase',fontFamily:F}}>Training Journal</div><div style={{color:'#3a3200',fontSize:12,marginTop:3,fontFamily:F}}>{cnt} sessions logged</div></div>
          <GBtn onClick={()=>setShowLog(true)} style={{fontSize:11,padding:'8px 14px'}}>+ Log</GBtn>
        </div>
        <Card><div style={{padding:'4px 16px'}}>
          {[...sessions].sort((a,b)=>new Date(b.session_date)-new Date(a.session_date)).map(s=><div key={s.id} onClick={()=>s.note&&setExpandedId(expandedId===s.id?null:s.id)} style={{padding:'12px 0',borderBottom:`1px solid ${BL}`,cursor:s.note?'pointer':'default'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:6,height:6,borderRadius:'50%',background:G,flexShrink:0}}/><span style={{color:'#fff',fontSize:14,fontWeight:700,fontFamily:F}}>{fmtL(s.session_date)}</span></div>
              {s.note&&<span style={{color:'#333',fontSize:14}}>›</span>}
            </div>
            {s.note&&expandedId!==s.id&&<div style={{color:'#2a2a2a',fontSize:12,marginTop:5,paddingLeft:16,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.note}</div>}
            {s.note&&expandedId===s.id&&<div style={{color:'#777',fontSize:13,marginTop:8,paddingLeft:16,lineHeight:1.7,borderLeft:`2px solid ${BL}`}}>{s.note}</div>}
          </div>)}
          {sessions.length===0&&<div style={{color:'#2a2a2a',padding:'24px 0',fontFamily:F}}>No sessions yet.</div>}
        </div></Card>
      </div>}

      {view==='schedule'&&<div>
        <div style={{fontWeight:800,fontSize:22,letterSpacing:2,color:G,textTransform:'uppercase',fontFamily:F,marginBottom:18}}>Class Schedule</div>
        {DAYS.map((day,di)=>{
          const cls=(initialSchedule||[]).filter(c=>c.day_of_week===di).sort((a,b)=>a.start_time.localeCompare(b.start_time));
          return <Card key={day}><div style={{display:'flex',gap:14,padding:'14px 16px',alignItems:cls.length?'flex-start':'center'}}>
            <div style={{width:44,height:44,borderRadius:3,background:cls.length?GK:'transparent',border:`1.5px solid ${cls.length?GD:BL}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:12,fontFamily:F,letterSpacing:1.5,color:cls.length?G:'#2a2a2a',flexShrink:0}}>{DAYSS[di].toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>{cls.length===0?<span style={{color:'#2a2a2a',fontSize:13,fontFamily:F}}>Rest Day</span>:cls.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8}}><span style={{color:G,fontSize:14,fontWeight:800,fontFamily:F,flexShrink:0}}>{c.start_time.slice(0,5)}</span><span style={{color:'#fff',fontSize:14,fontWeight:600,fontFamily:F}}>{c.class_name}</span><TPill type={c.type}/>{c.instructor&&<span style={{color:'#444',fontSize:12,fontFamily:FB}}>{c.instructor}</span>}</div>)}</div>
          </div></Card>;
        })}
      </div>}

      {view==='profile'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontWeight:800,fontSize:22,letterSpacing:2,color:G,textTransform:'uppercase',fontFamily:F}}>My Profile</div>
          <GhBtn onClick={openEdit}>Edit</GhBtn>
        </div>
        <Card><div style={{padding:'18px',display:'flex',alignItems:'flex-start',gap:14}}>
          <div style={{width:52,height:52,borderRadius:3,background:member.avatar_color||'#3e1460',border:`2px solid ${G}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:G,fontFamily:F,letterSpacing:1.5,flexShrink:0}}>{ini(member.name)}</div>
          <div><div style={{color:'#fff',fontSize:17,fontWeight:800,fontFamily:F}}>{member.name}</div><div style={{color:'#444',fontSize:12,marginTop:2,fontFamily:FB}}>{member.email}</div><div style={{marginTop:10}}><BeltBar belt={member.belt||'White'} stripes={member.stripes||0}/></div></div>
        </div></Card>
        {[{l:'Phone',v:member.phone,i:'📱'},{l:'Address',v:member.address,i:'📍'},{l:'Emergency Contact',v:member.emergency_contact,i:'🚨'}].map(f=><Card key={f.l}><div style={{padding:'14px 16px',display:'flex',gap:12,alignItems:'flex-start'}}><span style={{fontSize:17,flexShrink:0,marginTop:1}}>{f.i}</span><div><div style={{color:'#2e2800',fontSize:9,textTransform:'uppercase',letterSpacing:1.5,fontWeight:800,fontFamily:F}}>{f.l}</div><div style={{color:f.v?'#fff':'#2a2a2a',fontSize:14,marginTop:4,fontFamily:FB}}>{f.v||'Not set'}</div></div></div></Card>)}
        <Card><div style={{padding:'14px 16px'}}><SLabel>Membership</SLabel><div style={{display:'flex',justifyContent:'space-between'}}>
          <div><div style={{color:'#2e2800',fontSize:9,textTransform:'uppercase',letterSpacing:1.5,fontWeight:800,fontFamily:F}}>Joined</div><div style={{color:'#fff',fontSize:14,fontWeight:700,fontFamily:F,marginTop:4}}>{member.joined_at?fmtM(member.joined_at):'—'}</div></div>
          <div style={{textAlign:'right'}}><div style={{color:'#2e2800',fontSize:9,textTransform:'uppercase',letterSpacing:1.5,fontWeight:800,fontFamily:F}}>Next Billing</div><div style={{color:isOD?ORG:GRN,fontSize:14,fontWeight:700,fontFamily:F,marginTop:4}}>{member.next_payment_date?fmtM(member.next_payment_date):'—'}</div></div>
        </div></div></Card>
        <button onClick={signOut} style={{width:'100%',padding:12,background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:'#333',fontSize:11,fontFamily:F,letterSpacing:2,textTransform:'uppercase',cursor:'pointer',marginTop:4}}>Sign Out</button>
      </div>}
    </div>

    <Modal open={showLog} onClose={()=>setShowLog(false)} title="Log Session">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div><FL>Date</FL><input type="date" value={logDate} max={TODAYSTR} onChange={e=>setLogDate(e.target.value)} style={{width:'100%',background:'#111',border:`1px solid ${BL}`,borderRadius:3,padding:'10px 12px',color:'#fff',fontSize:14,outline:'none',fontFamily:FB,colorScheme:'dark',boxSizing:'border-box'}}/></div>
        <div><FL>Journal Note <span style={{color:'#2a2a2a',fontWeight:400}}>(optional)</span></FL><textarea value={logNote} onChange={e=>setLogNote(e.target.value)} rows={3} placeholder="What did you work on?" style={{width:'100%',background:'#111',border:`1px solid ${BL}`,borderRadius:3,padding:'10px 12px',color:'#fff',fontSize:14,outline:'none',fontFamily:FB,resize:'none',boxSizing:'border-box'}}/></div>
        <div style={{display:'flex',gap:10,marginTop:4}}>
          <GhBtn onClick={()=>setShowLog(false)} style={{flex:1}}>Cancel</GhBtn>
          <GBtn onClick={logSession} style={{flex:2,opacity:saving?.6:1}}>{saving?'Saving...':'Log It'}</GBtn>
        </div>
      </div>
    </Modal>

    <Modal open={showEdit} onClose={()=>setShowEdit(false)} title="Edit Profile">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {[{k:'phone',l:'Phone',p:'802-555-0000'},{k:'address',l:'Address',p:'123 Main St...'},{k:'emergency_contact',l:'Emergency Contact',p:'Name - Phone'}].map(f=><div key={f.k}><FL>{f.l}</FL><input value={editForm[f.k]} onChange={e=>setEditForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p} style={{width:'100%',background:'#111',border:`1px solid ${BL}`,borderRadius:3,padding:'10px 12px',color:'#fff',fontSize:14,outline:'none',fontFamily:FB,boxSizing:'border-box'}}/></div>)}
        <div><FL>Avatar Color</FL><div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:4}}>{AV_COLORS.map(c=><div key={c} onClick={()=>setEditForm(f=>({...f,avatar_color:c}))} style={{width:30,height:30,borderRadius:3,background:c,cursor:'pointer',border:editForm.avatar_color===c?`2px solid ${G}`:'2px solid transparent',boxSizing:'border-box'}}/>)}</div></div>
        <div style={{display:'flex',gap:10,marginTop:4}}>
          <GhBtn onClick={()=>setShowEdit(false)} style={{flex:1}}>Cancel</GhBtn>
          <GBtn onClick={saveProfile} style={{flex:2,opacity:saving?.6:1}}>{saving?'Saving...':'Save'}</GBtn>
        </div>
      </div>
    </Modal>
  </div>;
}
