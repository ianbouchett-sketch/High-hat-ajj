'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const G='#c9a227',GD='#8a6e18',BG='#080808',SURF='#111109',CARD='#161610',BL='#242200',ORG='#e06c1a';
const F="'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FB="'Barlow',Arial,sans-serif";
const inp={width:'100%',background:SURF,border:`1px solid ${BL}`,borderRadius:6,padding:'14px 16px',color:'#fff',fontSize:16,outline:'none',fontFamily:FB,boxSizing:'border-box',colorScheme:'dark'};

export default function LoginPage(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(false);

  async function handleLogin(){
    setError(null);
    if(!email||!password)return setError('Please enter your email and password.');
    setLoading(true);
    const{error:err}=await supabase.auth.signInWithPassword({email,password});
    if(err){setError(err.message);setLoading(false);return;}
    window.location.href='/portal';
  }

  return(
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 20px',fontFamily:FB}}>
      <div style={{width:'100%',maxWidth:400}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:40}}>
          <img src="/logo.png" alt="High Hat BJJ" style={{height:80,width:'auto',objectFit:'contain',marginBottom:16}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block';}}/>
          <div style={{display:'none'}}>
            <div style={{fontWeight:900,fontSize:32,letterSpacing:4,color:G,textTransform:'uppercase',fontFamily:F,lineHeight:1}}>HIGH HAT</div>
            <div style={{fontSize:12,color:'#555',letterSpacing:3,textTransform:'uppercase',fontFamily:F,marginTop:4}}>American Jiu Jitsu</div>
          </div>
        </div>

        <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:16,overflow:'hidden'}}>
          <div style={{height:3,background:`linear-gradient(90deg,${G},${GD})`}}/>
          <div style={{padding:'32px 28px'}}>
            <div style={{fontWeight:800,fontSize:24,letterSpacing:1,color:'#fff',textTransform:'uppercase',marginBottom:6,fontFamily:F}}>Welcome Back</div>
            <div style={{color:'#555',fontSize:15,marginBottom:28,fontFamily:FB}}>Sign in to your member portal</div>

            {error&&<div style={{background:'#1a0800',border:'1px solid #7a3300',borderRadius:8,padding:'12px 16px',color:ORG,fontSize:14,marginBottom:20,fontFamily:FB}}>{error}</div>}

            <div style={{marginBottom:16}}>
              <div style={{color:GD,fontSize:11,letterSpacing:1.5,textTransform:'uppercase',marginBottom:8,fontWeight:800,fontFamily:F}}>Email</div>
              <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="you@example.com"/>
            </div>
            <div style={{marginBottom:28}}>
              <div style={{color:GD,fontSize:11,letterSpacing:1.5,textTransform:'uppercase',marginBottom:8,fontWeight:800,fontFamily:F}}>Password</div>
              <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="Your password"/>
            </div>
            <button onClick={handleLogin} disabled={loading} style={{width:'100%',padding:'15px',background:G,border:'none',borderRadius:8,color:'#000',fontWeight:800,fontSize:16,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',opacity:loading?0.6:1}}>
              {loading?'Signing In...':'Sign In'}
            </button>
            <div style={{textAlign:'center',color:'#555',fontSize:14,marginTop:20,fontFamily:FB}}>
              New member? <a href="/signup" style={{color:G,textDecoration:'none',fontWeight:700}}>Create account</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
