'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const G='#c9a227',GD='#8a6e18',BG='#060606',CARD='#0d0d0b',BL='#2e2600';
const F="'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FB="'Barlow','Arial Narrow',Arial,sans-serif";

function Field({ label, children }) {
  return (
    <div>
      <div style={{color:GD,fontSize:10,letterSpacing:1.5,textTransform:'uppercase',marginBottom:6,fontWeight:800,fontFamily:F}}>{label}</div>
      {children}
    </div>
  );
}
const inputStyle = {width:'100%',background:'#111',border:`1px solid ${BL}`,borderRadius:3,padding:'11px 14px',color:'#fff',fontSize:15,outline:'none',fontFamily:FB,boxSizing:'border-box'};

export default function SignupPage() {
  const [step, setStep] = useState(1); // 1=info, 2=done
  const [form, setForm] = useState({ name:'', email:'', phone:'', emergency_contact:'', password:'', confirm:'' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(f => ({...f, [k]: v})); }

  async function handleSignup() {
    setError(null);
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.email.trim()) return setError('Email is required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);

    const { error: signupErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          phone: form.phone,
          emergency_contact: form.emergency_contact,
        }
      }
    });

    if (signupErr) { setError(signupErr.message); setLoading(false); return; }

    // Update the member row with phone and emergency contact
    // The trigger creates the row, we just update the extra fields
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('members').update({
        name: form.name,
        phone: form.phone,
        emergency_contact: form.emergency_contact,
      }).eq('id', user.id);
    }

    setLoading(false);
    setStep(2);
  }

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:FB}}>
      <div style={{width:'100%',maxWidth:440}}>
        {/* Logo */}
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
          <div style={{padding:28}}>
            {step === 1 && (
              <>
                <div style={{fontWeight:800,fontSize:20,letterSpacing:2,color:'#fff',textTransform:'uppercase',marginBottom:6,fontFamily:F}}>Join High Hat</div>
                <div style={{color:'#444',fontSize:13,marginBottom:24,fontFamily:FB}}>Create your member account</div>
                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  {error && <div style={{background:'#1a0800',border:'1px solid #7a3300',borderRadius:4,padding:'10px 14px',color:'#c97316',fontSize:13,fontFamily:FB}}>{error}</div>}
                  <Field label="Full Name"><input style={inputStyle} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Marcus Tavares"/></Field>
                  <Field label="Email"><input style={inputStyle} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com"/></Field>
                  <Field label="Phone"><input style={inputStyle} type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="802-555-0000"/></Field>
                  <Field label="Emergency Contact"><input style={inputStyle} value={form.emergency_contact} onChange={e=>set('emergency_contact',e.target.value)} placeholder="Name - Phone number"/></Field>
                  <Field label="Password"><input style={inputStyle} type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min 6 characters"/></Field>
                  <Field label="Confirm Password"><input style={inputStyle} type="password" value={form.confirm} onChange={e=>set('confirm',e.target.value)} placeholder="Repeat password"/></Field>
                  <button onClick={handleSignup} disabled={loading}
                    style={{width:'100%',padding:'13px',background:G,border:'none',borderRadius:3,color:'#000',fontWeight:800,fontSize:14,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',cursor:'pointer',marginTop:4,opacity:loading?0.6:1}}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                  <div style={{textAlign:'center',color:'#444',fontSize:13,fontFamily:FB}}>
                    Already have an account? <a href="/login" style={{color:G,textDecoration:'none',fontWeight:700}}>Sign in</a>
                  </div>
                </div>
              </>
            )}
            {step === 2 && (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:48,marginBottom:16}}>✓</div>
                <div style={{fontWeight:800,fontSize:20,letterSpacing:2,color:G,textTransform:'uppercase',marginBottom:12,fontFamily:F}}>Account Created</div>
                <div style={{color:'#888',fontSize:14,fontFamily:FB,lineHeight:1.6,marginBottom:24}}>
                  Check your email to confirm your account, then sign in to access your member portal. Your instructor will activate your membership once payment is set up.
                </div>
                <a href="/login" style={{display:'inline-block',padding:'12px 28px',background:G,borderRadius:3,color:'#000',fontWeight:800,fontSize:13,fontFamily:F,letterSpacing:1.5,textTransform:'uppercase',textDecoration:'none'}}>Sign In</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
