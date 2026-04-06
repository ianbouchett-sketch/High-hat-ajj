'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const G='#c9a227',GD='#8a6e18',BG='#060606',CARD='#0d0d0b',BL='#2e2600',ORG='#c97316';
const F="'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FB="'Barlow','Arial Narrow',Arial,sans-serif";
const inp={width:'100%',background:'#111',border:`1px solid ${BL}`,borderRadius:3,padding:'11px 14px',color:'#fff',fontSize:15,outline:'none',fontFamily:FB,boxSizing:'border-box',WebkitAppearance:'none',colorScheme:'dark'};
const ADULT_BELTS=['White','Blue','Purple','Brown','Black'];
const KIDS_BELTS=['White','Grey','Yellow','Orange','Green'];
const HEARD=['','Friend/Family','Social Media','Google Search','Drove By','Other'];
const GENDERS=['','Male','Female','Non-binary','Prefer not to say'];

function FL({children,req,optional}){
  return <div style={{color:GD,fontSize:10,letterSpacing:1.5,textTransform:'uppercase',marginBottom:6,fontWeight:800,fontFamily:F,display:'flex',alignItems:'center',gap:6}}>
    {children}
    {req&&<span style={{color:ORG}}>*</span>}
    {optional&&<span style={{color:'#333',fontWeight:400,fontSize:9,letterSpacing:1,textTransform:'uppercase'}}>(optional)</span>}
  </div>;
}
function Divider({label}){return <div style={{display:'flex',alignItems:'center',gap:10,margin:'20px 0 16px'}}><div style={{height:1,flex:1,background:BL}}/><span style={{color:GD,fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',fontFamily:F,flexShrink:0,whiteSpace:'nowrap'}}>{label}</span><div style={{height:1,flex:1,background:BL}}/></div>}
function Err({msg}){return msg?<div style={{background:'#1a0800',border:'1px solid #7a3300',borderRadius:4,padding:'10px 14px',color:ORG,fontSize:13,marginBottom:16,fontFamily:FB}}>{msg}</div>:null}

function calcAge(dob){
  if(!dob)return null;
  const d=new Date(dob),now=new Date();
  let a=now.getFullYear()-d.getFullYear();
  if(now.getMonth()<d.getMonth()||(now.getMonth()===d.getMonth()&&now.getDate()<d.getDate()))a--;
  return a;
}

export default function SignupPage(){
  const [step,setStep]=useState(1);
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(false);
  const [f,setF]=useState({
    first_name:'',last_name:'',email:'',dob:'',gender:'',
    parent_name:'',cell_phone:'',
    address1:'',city:'',state:'',zip:'',
    ec_first:'',ec_last:'',ec_phone:'',
    experience:'',limitations:'',allergies:'',height_weight:'',heard:'',
    belt:'',stripes:0,
    password:'',confirm:'',
    waiver_agreed:false,signature:'',
  });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const age=calcAge(f.dob);
  const isMinor=age!==null&&age<18;
  const isKid=age!==null&&age<16;
  const belts=isKid?KIDS_BELTS:ADULT_BELTS;

  function handleDOB(v){
    const a=calcAge(v);
    const kid=a!==null&&a<16;
    setF(p=>{
      const ok=kid?KIDS_BELTS.includes(p.belt):ADULT_BELTS.includes(p.belt);
      return{...p,dob:v,belt:ok?p.belt:'',stripes:0};
    });
  }

  function validate1(){
    if(!f.first_name.trim()||!f.last_name.trim())return'First and last name are required.';
    if(!f.email.trim())return'Email is required.';
    if(!f.dob)return'Date of birth is required.';
    if(!f.cell_phone.trim())return'Cell phone is required.';
    if(!f.ec_first.trim()||!f.ec_last.trim()||!f.ec_phone.trim())return'Emergency contact name and phone are required.';
    if(!f.belt)return'Please select a belt rank.';
    return null;
  }
  function validate2(){
    if(!f.waiver_agreed)return'You must agree to the waiver.';
    if(!f.signature.trim())return'Signature is required.';
    return null;
  }
  function validate3(){
    if(f.password.length<6)return'Password must be at least 6 characters.';
    if(f.password!==f.confirm)return'Passwords do not match.';
    return null;
  }

  function go2(){const e=validate1();if(e){setError(e);return;}setError(null);setStep(2);}
  function go3(){const e=validate2();if(e){setError(e);return;}setError(null);setStep(3);}

  async function handleSignup(){
    const e=validate3();if(e){setError(e);return;}
    setError(null);setLoading(true);
    const fullName=`${f.first_name.trim()} ${f.last_name.trim()}`;
    const ec=`${f.ec_first} ${f.ec_last} - ${f.ec_phone}`;
    const{data,error:err}=await supabase.auth.signUp({email:f.email,password:f.password,options:{data:{name:fullName}}});
    if(err){setError(err.message);setLoading(false);return;}
    const uid=data?.user?.id;
    if(uid){
      await supabase.from('members').upsert({
        id:uid,email:f.email,name:fullName,
        date_of_birth:f.dob,
        gender:f.gender||null,
        phone:f.cell_phone,
        parent_name:f.parent_name||null,
        emergency_contact:ec,
        address_line1:f.address1||null,
        city:f.city||null,
        state:f.state||null,
        zip:f.zip||null,
        martial_arts_experience:f.experience||null,
        physical_limitations:f.limitations||null,
        allergies_medications:f.allergies||null,
        height_weight:f.height_weight||null,
        heard_about_us:f.heard||null,
        belt:f.belt,
        stripes:isKid?0:+f.stripes,
        status:'pending',
        joined_at:new Date().toISOString().split('T')[0],
        next_payment_date:new Date().toISOString().split('T')[0],
        waiver_signed_at:new Date().toISOString(),
        waiver_signed_by:isMinor?f.parent_name||fullName:fullName,
      },{onConflict:'id'});
    }
    setLoading(false);setStep(4);
  }

  const Logo=()=><div style={{textAlign:'center',marginBottom:28}}>
    <div style={{display:'inline-flex',alignItems:'center',gap:12}}>
      <div style={{position:'relative',width:48,height:36,flexShrink:0}}>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',gap:2,paddingTop:2}}>{[0,1,2,3,4,5].map(i=><div key={i} style={{height:4,background:G,opacity:i%2===0?1:0.15,borderRadius:1}}/>)}</div>
        <div style={{position:'absolute',top:2,left:2,width:18,height:18,background:G,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:7,fontWeight:900,color:'#000',fontFamily:F}}>★★</span></div>
      </div>
      <div style={{textAlign:'left'}}>
        <div style={{fontWeight:800,fontSize:20,letterSpacing:2,color:G,textTransform:'uppercase',fontFamily:F,lineHeight:1}}>High Hat</div>
        <div style={{fontSize:9,color:'#555',letterSpacing:1.5,textTransform:'uppercase',fontFamily:F}}>American Jiu Jitsu</div>
      </div>
    </div>
  </div>;

  const Steps=()=><div style={{display:'flex',gap:4,marginBottom:24}}>
    {['Info','Waiver','Account'].map((l,i)=><div key={i} style={{flex:1,textAlign:'center'}}>
      <div style={{height:3,borderRadius:2,background:step>i+1?G:step===i+1?G:'#222',opacity:step>i+1?0.4:1,marginBottom:4}}/>
      <div style={{fontSize:9,fontFamily:F,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:step===i+1?G:'#333'}}>{l}</div>
    </div>)}
  </div>;

  return(
    <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'32px 16px 60px',fontFamily:FB}}>
      <div style={{width:'100%',maxWidth:500}}>
        <Logo/>
        {step<4&&<Steps/>}
        <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:6,overflow:'hidden'}}>
          <div style={{height:3,background:G}}/>
          <div style={{padding:'24px 24px 28px'}}>

            {/* ---- STEP 1: INFO ---- */}
            {step===1&&<>
              <div style={{fontWeight:800,fontSize:20,letterSpacing:2,color:'#fff',textTransform:'uppercase',marginBottom:4,fontFamily:F}}>Member Information</div>
              <div style={{color:'#444',fontSize:13,marginBottom:20}}><span style={{color:ORG}}>*</span> Required fields</div>
              <Err msg={error}/>

              <Divider label="Student"/>
              <div style={{display:'flex',gap:12,marginBottom:14}}>
                <div style={{flex:1}}><FL req>First Name</FL><input style={inp} value={f.first_name} onChange={e=>set('first_name',e.target.value)} placeholder="Marcus"/></div>
                <div style={{flex:1}}><FL req>Last Name</FL><input style={inp} value={f.last_name} onChange={e=>set('last_name',e.target.value)} placeholder="Tavares"/></div>
              </div>
              <div style={{marginBottom:14}}><FL req>Email</FL><input style={inp} type="email" value={f.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com"/></div>
              <div style={{display:'flex',gap:12,marginBottom:14}}>
                <div style={{flex:1}}><FL req>Date of Birth</FL><input style={inp} type="date" value={f.dob} onChange={e=>handleDOB(e.target.value)}/></div>
                <div style={{flex:1}}><FL optional>Gender</FL>
                  <select style={inp} value={f.gender} onChange={e=>set('gender',e.target.value)}>
                    {GENDERS.map(g=><option key={g} value={g}>{g||'-- Select --'}</option>)}
                  </select>
                </div>
              </div>
              {age!==null&&<div style={{background:'#111',border:`1px solid ${BL}`,borderRadius:3,padding:'8px 12px',marginBottom:14,color:GD,fontSize:12,fontFamily:F,letterSpacing:1}}>
                Age: <span style={{color:G,fontWeight:800}}>{age}</span>{isMinor?' — parent name recommended below':''}
              </div>}

              <Divider label="Contact"/>
              <div style={{marginBottom:14}}><FL req>Cell Phone</FL><input style={inp} type="tel" value={f.cell_phone} onChange={e=>set('cell_phone',e.target.value)} placeholder="802-555-0000"/></div>
              {isMinor&&<div style={{marginBottom:14}}><FL optional>Parent / Guardian Name</FL><input style={inp} value={f.parent_name} onChange={e=>set('parent_name',e.target.value)} placeholder="Parent full name"/></div>}
              <div style={{display:'flex',gap:10,marginBottom:14}}>
                <div style={{flex:2}}><FL optional>Address</FL><input style={inp} value={f.address1} onChange={e=>set('address1',e.target.value)} placeholder="338 Dorset St"/></div>
                <div style={{flex:1}}><FL optional>City</FL><input style={inp} value={f.city} onChange={e=>set('city',e.target.value)} placeholder="S. Burlington"/></div>
              </div>
              <div style={{display:'flex',gap:10,marginBottom:14}}>
                <div style={{flex:1}}><FL optional>State</FL><input style={inp} value={f.state} onChange={e=>set('state',e.target.value)} placeholder="VT"/></div>
                <div style={{flex:1}}><FL optional>ZIP</FL><input style={inp} value={f.zip} onChange={e=>set('zip',e.target.value)} placeholder="05403"/></div>
              </div>

              <Divider label="Emergency Contact"/>
              <div style={{display:'flex',gap:12,marginBottom:14}}>
                <div style={{flex:1}}><FL req>First Name</FL><input style={inp} value={f.ec_first} onChange={e=>set('ec_first',e.target.value)} placeholder="Jane"/></div>
                <div style={{flex:1}}><FL req>Last Name</FL><input style={inp} value={f.ec_last} onChange={e=>set('ec_last',e.target.value)} placeholder="Tavares"/></div>
              </div>
              <div style={{marginBottom:14}}><FL req>Phone</FL><input style={inp} type="tel" value={f.ec_phone} onChange={e=>set('ec_phone',e.target.value)} placeholder="802-555-0000"/></div>

              <Divider label="Training Background"/>
              <div style={{marginBottom:14}}><FL optional>Experience in Martial Arts</FL><textarea style={{...inp,resize:'vertical',minHeight:60}} value={f.experience} onChange={e=>set('experience',e.target.value)} placeholder="e.g. 2 years wrestling, no BJJ experience"/></div>
              <div style={{marginBottom:14}}><FL optional>Physical Limitations</FL><input style={inp} value={f.limitations} onChange={e=>set('limitations',e.target.value)} placeholder="e.g. None, or describe any injuries"/></div>
              <div style={{marginBottom:14}}><FL optional>Allergies / Medications</FL><input style={inp} value={f.allergies} onChange={e=>set('allergies',e.target.value)} placeholder="e.g. None"/></div>
              <div style={{marginBottom:14}}><FL optional>Height / Weight (for Gi size)</FL><input style={inp} value={f.height_weight} onChange={e=>set('height_weight',e.target.value)} placeholder="5'10 / 175 lbs"/></div>
              <div style={{marginBottom:14}}><FL optional>How Did You Hear About Us?</FL>
                <select style={inp} value={f.heard} onChange={e=>set('heard',e.target.value)}>
                  {HEARD.map(h=><option key={h} value={h}>{h||'-- Select --'}</option>)}
                </select>
              </div>

              <Divider label="Belt Rank"/>
              {!f.dob&&<div style={{color:'#444',fontSize:12,marginBottom:14}}>Enter date of birth above to see belt options.</div>}
              {f.dob&&<>
                <div style={{color:'#444',fontSize:12,marginBottom:10}}>{isKid?'Kids belts (under 16)':'Adult belts (16+)'}</div>
                <div style={{display:'flex',gap:12,marginBottom:4}}>
                  <div style={{flex:1}}><FL req>Current Belt</FL>
                    <select style={inp} value={f.belt} onChange={e=>set('belt',e.target.value)}>
                      <option value=''>-- Select --</option>
                      {belts.map(b=><option key={b}>{b}</option>)}
                    </select>
                  </div>
                  {!isKid&&f.belt&&<div style={{flex:1}}><FL optional>Stripes</FL>
                    <select style={inp} value={f.stripes} onChange={e=>set('stripes',+e.target.value)}>
                      {[0,1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>}
                </div>
              </>}

              <button onClick={go2} style={{width:'100%',padding:'13px',background:G,border:'none',borderRadius:3,color:'#000',fontWeight:800,fontSize:14,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',marginTop:20}}>
                Continue to Waiver →
              </button>
              <div style={{textAlign:'center',color:'#444',fontSize:13,marginTop:14}}>Already have an account? <a href="/login" style={{color:G,textDecoration:'none',fontWeight:700}}>Sign in</a></div>
            </>}

            {/* ---- STEP 2: WAIVER ---- */}
            {step===2&&<>
              <div style={{fontWeight:800,fontSize:20,letterSpacing:2,color:'#fff',textTransform:'uppercase',marginBottom:4,fontFamily:F}}>Liability Waiver</div>
              <div style={{color:'#444',fontSize:13,marginBottom:20}}>
                {isMinor?`Parent or guardian signature required for ${f.first_name}.`:'Please read and sign below.'}
              </div>
              <Err msg={error}/>
              <div style={{background:'#0a0a08',border:`1px solid ${BL}`,borderRadius:4,padding:'18px',marginBottom:20,maxHeight:220,overflowY:'auto'}}>
                <div style={{color:'#888',fontSize:13,fontFamily:FB,lineHeight:1.8}}>
                  <p>You agree you are engaging in physical exercise and fitness training that could cause injury. You are voluntarily participating in these activities and are assuming all risks of injury that might result.</p><br/>
                  <p>You hereby agree to waive any claims or rights that you might otherwise have to sue High Hat Brazilian Jiu Jitsu, or our staff.</p><br/>
                  <p>If you have any physical conditions that may impair your ability to engage in these activities, it is your responsibility to provide us with a physician's statement describing any limitations to participate in this program.</p><br/>
                  <p>It is always advisable to consult your physician prior to undertaking any physical exercise program.</p>
                </div>
              </div>

              <div onClick={()=>set('waiver_agreed',!f.waiver_agreed)} style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:20,cursor:'pointer',userSelect:'none',padding:'12px 14px',background:'#111',border:`1px solid ${f.waiver_agreed?G:BL}`,borderRadius:4}}>
                <div style={{width:20,height:20,border:`2px solid ${f.waiver_agreed?G:'#444'}`,borderRadius:3,background:f.waiver_agreed?G:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                  {f.waiver_agreed&&<span style={{color:'#000',fontSize:12,fontWeight:900,lineHeight:1}}>✓</span>}
                </div>
                <div style={{color:'#fff',fontSize:14,fontFamily:FB,lineHeight:1.5}}>
                  I agree to the terms of this waiver.
                  {isMinor&&<span style={{color:GD,fontSize:12,display:'block',marginTop:3}}>I confirm I am the parent or legal guardian of {f.first_name} {f.last_name}.</span>}
                </div>
              </div>

              <div style={{marginBottom:14}}>
                <FL req>{isMinor?'Parent / Guardian Signature (type full name)':'Signature (type your full name)'}</FL>
                <input style={inp} value={f.signature} onChange={e=>set('signature',e.target.value)} placeholder={isMinor?f.parent_name||'Parent full name':`${f.first_name} ${f.last_name}`}/>
                <div style={{color:'#333',fontSize:11,fontFamily:FB,marginTop:4}}>Typing your name constitutes a legally binding electronic signature.</div>
              </div>

              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button onClick={()=>{setError(null);setStep(1);}} style={{flex:1,padding:'12px',background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:'#555',fontSize:12,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer'}}>← Back</button>
                <button onClick={go3} style={{flex:2,padding:'13px',background:G,border:'none',borderRadius:3,color:'#000',fontWeight:800,fontSize:14,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer'}}>Continue →</button>
              </div>
            </>}

            {/* ---- STEP 3: ACCOUNT ---- */}
            {step===3&&<>
              <div style={{fontWeight:800,fontSize:20,letterSpacing:2,color:'#fff',textTransform:'uppercase',marginBottom:4,fontFamily:F}}>Create Account</div>
              <div style={{color:'#444',fontSize:13,marginBottom:20}}>Almost done. Set your password to access the member portal.</div>
              <Err msg={error}/>
              <div style={{marginBottom:14}}><FL>Email</FL><div style={{color:'#888',fontSize:14,fontFamily:FB,padding:'11px 0'}}>{f.email}</div></div>
              <div style={{marginBottom:14}}><FL req>Password</FL><input style={inp} type="password" value={f.password} onChange={e=>setF(p=>({...p,password:e.target.value}))} placeholder="Min 6 characters"/></div>
              <div style={{marginBottom:20}}><FL req>Confirm Password</FL><input style={inp} type="password" value={f.confirm} onChange={e=>setF(p=>({...p,confirm:e.target.value}))} placeholder="Repeat password"/></div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>{setError(null);setStep(2);}} style={{flex:1,padding:'12px',background:'transparent',border:`1px solid ${BL}`,borderRadius:3,color:'#555',fontSize:12,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer'}}>← Back</button>
                <button onClick={handleSignup} disabled={loading} style={{flex:2,padding:'13px',background:G,border:'none',borderRadius:3,color:'#000',fontWeight:800,fontSize:14,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',opacity:loading?0.6:1}}>
                  {loading?'Creating Account...':'Create Account'}
                </button>
              </div>
            </>}

            {/* ---- STEP 4: DONE ---- */}
            {step===4&&<div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:48,marginBottom:16}}>🥋</div>
              <div style={{fontWeight:800,fontSize:20,letterSpacing:2,color:G,textTransform:'uppercase',marginBottom:12,fontFamily:F}}>Welcome to High Hat</div>
              <div style={{color:'#888',fontSize:14,fontFamily:FB,lineHeight:1.7,marginBottom:16}}>Your account and waiver have been submitted.</div>
              <div style={{background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'16px',marginBottom:24,color:'#555',fontSize:13,fontFamily:FB,lineHeight:1.7}}>
                Your instructor will review your membership and send you a payment link to activate your account shortly.
              </div>
              <a href="/login" style={{display:'inline-block',padding:'12px 28px',background:G,borderRadius:3,color:'#000',fontWeight:800,fontSize:13,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',textDecoration:'none'}}>Sign In</a>
            </div>}

          </div>
        </div>
      </div>
    </div>
  );
}
