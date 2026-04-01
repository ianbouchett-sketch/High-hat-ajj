'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const G='#c9a227',GD='#8a6e18',BG='#060606',CARD='#0d0d0b',BL='#2e2600',ORG='#c97316';
const F="'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FB="'Barlow','Arial Narrow',Arial,sans-serif";
const inp={width:'100%',background:'#111',border:`1px solid ${BL}`,borderRadius:3,padding:'11px 14px',color:'#fff',fontSize:15,outline:'none',fontFamily:FB,boxSizing:'border-box',WebkitAppearance:'none'};
const BELTS=['White','Blue','Purple','Brown','Black'];

function FL({children}){return <div style={{color:GD,fontSize:10,letterSpacing:1.5,textTransform:'uppercase',marginBottom:6,fontWeight:800,fontFamily:F}}>{children}</div>}

export default function SignupPage(){
  const [form,setForm]=useState({name:'',email:'',phone:'',emergency_contact:'',belt:'White',stripes:'0',password:'',confirm:''});
  const [step,setStep]=useState(1);
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  async function handleSignup(){
    setError(null);
    if(!form.name.trim())return setError('Name is required.');
    if(!form.email.trim())return setError('Email is required.');
    if(form.password.length<6)return setError('Password must be at least 6 characters.');
    if(form.password!==form.confirm)return setError('Passwords do not match.');
    setLoading(true);

    const{error:signupErr}=await supabase.auth.signUp({
      email:form.email,
      password:form.password,
      options:{data:{name:form.name,phone:form.phone,emergency_contact:form.emergency_contact,belt:form.belt,stripes:+form.stripes}}
    });

    if(signupErr){setError(signupErr.message);setLoading(false);return;}

    // Update member row with all details -- trigger creates it, we fill in the rest
    const{data:{user}}=await supabase.auth.getUser();
    if(user){
      await supabase.from('members').update({
        name:form.name,
        phone:form.phone,
        emergency_contact:form.emergency_contact,
        belt:form.belt,
        stripes:+form.stripes,
        status:'pending',
      }).eq('id',user.id);
    }

    setLoading(false);
    setStep(2);
  }

  return(
    <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:FB}}>
      <div style={{width:'100%',maxWidth:460}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:32}}>
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
        </div>

        <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:6,overflow:'hidden'}}>
          <div style={{height:3,background:G}}/>
          <div style={{padding:28}}>
            {step===1&&<>
              <div style={{fontWeight:800,fontSize:20,letterSpacing:2,color:'#fff',textTransform:'uppercase',marginBottom:4,fontFamily:F}}>Join High Hat</div>
              <div style={{color:'#444',fontSize:13,marginBottom:24,fontFamily:FB}}>Create your member account</div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {error&&<div style={{background:'#1a0800',border:'1px solid #7a3300',borderRadius:4,padding:'10px 14px',color:ORG,fontSize:13}}>{error}</div>}
                <div><FL>Full Name</FL><input style={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Marcus Tavares"/></div>
                <div><FL>Email</FL><input style={inp} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com"/></div>
                <div><FL>Phone</FL><input style={inp} type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="802-555-0000"/></div>
                <div><FL>Emergency Contact</FL><input style={inp} value={form.emergency_contact} onChange={e=>set('emergency_contact',e.target.value)} placeholder="Name - Phone number"/></div>
                {/* Belt and stripes */}
                <div style={{display:'flex',gap:12}}>
                  <div style={{flex:1}}>
                    <FL>Current Belt</FL>
                    <select style={inp} value={form.belt} onChange={e=>set('belt',e.target.value)}>
                      {BELTS.map(b=><option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{flex:1}}>
                    <FL>Stripes</FL>
                    <select style={inp} value={form.stripes} onChange={e=>set('stripes',e.target.value)}>
                      {[0,1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{height:1,background:BL,margin:'4px 0'}}/>
                <div><FL>Password</FL><input style={inp} type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min 6 characters"/></div>
                <div><FL>Confirm Password</FL><input style={inp} type="password" value={form.confirm} onChange={e=>set('confirm',e.target.value)} placeholder="Repeat password"/></div>
                <button onClick={handleSignup} disabled={loading} style={{width:'100%',padding:'13px',background:G,border:'none',borderRadius:3,color:'#000',fontWeight:800,fontSize:14,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',marginTop:4,opacity:loading?0.6:1}}>
                  {loading?'Creating Account...':'Create Account'}
                </button>
                <div style={{textAlign:'center',color:'#444',fontSize:13}}>Already have an account? <a href="/login" style={{color:G,textDecoration:'none',fontWeight:700}}>Sign in</a></div>
              </div>
            </>}

            {step===2&&<div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:48,marginBottom:16}}>🥋</div>
              <div style={{fontWeight:800,fontSize:20,letterSpacing:2,color:G,textTransform:'uppercase',marginBottom:12,fontFamily:F}}>Welcome to High Hat</div>
              <div style={{color:'#888',fontSize:14,fontFamily:FB,lineHeight:1.7,marginBottom:8}}>
                Your account has been created. Check your email to confirm your address.
              </div>
              <div style={{background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'16px',marginBottom:24,color:'#666',fontSize:13,fontFamily:FB,lineHeight:1.7}}>
                Your instructor will review your membership and send you a payment link to activate your account. You'll receive a text or email shortly.
              </div>
              <a href="/login" style={{display:'inline-block',padding:'12px 28px',background:G,borderRadius:3,color:'#000',fontWeight:800,fontSize:13,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',textDecoration:'none'}}>Sign In</a>
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
