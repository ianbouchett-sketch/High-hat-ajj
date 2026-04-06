'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const G='#c9a227',GD='#8a6e18',BG='#060606',CARD='#0d0d0b',BL='#2e2600';
const F="'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FB="'Barlow','Arial Narrow',Arial,sans-serif";
const inputStyle = {width:'100%',background:'#111',border:`1px solid ${BL}`,borderRadius:4,padding:'14px 16px',color:'#fff',fontSize:16,outline:'none',fontFamily:FB,boxSizing:'border-box'};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!email || !password) return setError('Please enter your email and password.');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/portal');
  }

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:FB}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,background:G,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:18,color:'#000',fontFamily:F,letterSpacing:1}}>HH</div>
            <div style={{textAlign:'left'}}>
              <div style={{fontWeight:800,fontSize:22,letterSpacing:3,color:G,textTransform:'uppercase',fontFamily:F,lineHeight:1}}>High Hat</div>
              <div style={{fontSize:10,color:'#666',letterSpacing:2,textTransform:'uppercase',fontFamily:F}}>American Jiu Jitsu</div>
            </div>
          </div>
        </div>

        <div style={{background:CARD,border:`1px solid ${BL}`,borderRadius:6,overflow:'hidden'}}>
          <div style={{height:3,background:G}}/>
          <div style={{padding:32}}>
            <div style={{fontWeight:800,fontSize:24,letterSpacing:2,color:'#fff',textTransform:'uppercase',marginBottom:8,fontFamily:F}}>Member Sign In</div>
            <div style={{color:'#444',fontSize:15,marginBottom:24,fontFamily:FB}}>Access your member portal</div>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {error && <div style={{background:'#1a0800',border:'1px solid #7a3300',borderRadius:4,padding:'10px 14px',color:'#c97316',fontSize:13}}>{error}</div>}
              <div>
                <div style={{color:GD,fontSize:12,letterSpacing:1.5,textTransform:'uppercase',marginBottom:8,fontWeight:800,fontFamily:F}}>Email</div>
                <input style={inputStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="you@example.com"/>
              </div>
              <div>
                <div style={{color:GD,fontSize:12,letterSpacing:1.5,textTransform:'uppercase',marginBottom:8,fontWeight:800,fontFamily:F}}>Password</div>
                <input style={inputStyle} type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="Your password"/>
              </div>
              <button onClick={handleLogin} disabled={loading}
                style={{width:'100%',padding:'15px',background:G,border:'none',borderRadius:4,color:'#000',fontWeight:800,fontSize:16,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',marginTop:4,opacity:loading?0.6:1}}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              <div style={{textAlign:'center',color:'#444',fontSize:15,fontFamily:FB}}>
                New member? <a href="/signup" style={{color:G,textDecoration:'none',fontWeight:700}}>Create account</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
