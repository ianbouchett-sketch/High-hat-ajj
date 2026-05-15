'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

async function adminUpdate(id, updates) {
  const res = await fetch('/api/member', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  const data = await res.json();
  if (!res.ok || data.error) console.error('adminUpdate failed:', data.error);
  return data;
}

const G='#c9a227',GD='#8a6e18',GK='#1a1400';
const BG='#080808',SURF='#111109',CARD='#161610',BL='#242200';
const GRN='#3dba6b',ORG='#e06c1a',RED='#c94040',BLUE='#3a7abd',TEAL='#2ab5a0';
const F="'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FB="'Barlow',Arial,sans-serif";
const FN="'Barlow Condensed','Arial Narrow',Arial,sans-serif";

const BELT_CFG={White:{bg:'#e8e8e0',tx:'#111',br:'#ccc'},Grey:{bg:'#777',tx:'#fff',br:'#999'},Yellow:{bg:'#c9a227',tx:'#000',br:'#a07800'},Orange:{bg:'#c97316',tx:'#fff',br:'#a05010'},Green:{bg:'#2a6a2a',tx:'#fff',br:'#1a4a1a'},Blue:{bg:'#1a3a6e',tx:'#fff',br:'#2a5aae'},Purple:{bg:'#3e1460',tx:'#fff',br:'#6a2aaa'},Brown:{bg:'#4a2000',tx:'#fff',br:'#7a3e10'},Black:{bg:'#111',tx:'#fff',br:'#c0392b'}};
