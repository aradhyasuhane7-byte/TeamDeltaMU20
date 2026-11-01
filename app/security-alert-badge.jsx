'use client';
import {useEffect,useState} from 'react';
import {authHeaders} from './auth-client';
export default function SecurityAlertBadge({workspace,onOpen}){const [count,setCount]=useState(0);useEffect(()=>{let active=true;async function load(){try{const r=await fetch('/api/security?'+new URLSearchParams({workspace}),{headers:authHeaders()});if(!r.ok)return;const b=await r.json();if(active)setCount(b.alerts.filter(a=>!a.acknowledged).length)}catch{}}load();const timer=setInterval(load,15000);return()=>{active=false;clearInterval(timer)}},[workspace]);return count>0?<button className="security-alert-badge" onClick={onOpen}>Security alerts · {count}</button>:null}
