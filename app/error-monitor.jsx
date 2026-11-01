'use client';
import {Component,useEffect} from 'react';
import {authHeaders} from './auth-client';
import {cleanError} from '../lib/operations';
export function reportClientError(error){try{fetch('/api/foundation',{method:'POST',headers:{'Content-Type':'application/json',...authHeaders()},body:JSON.stringify({action:'error',message:cleanError(error?.message||error)})}).catch(()=>{})}catch{}}
export function ErrorMonitor(){useEffect(()=>{const error=e=>reportClientError(e.error||e.message),reject=e=>reportClientError(e.reason||'Unhandled request failure');window.addEventListener('error',error);window.addEventListener('unhandledrejection',reject);return()=>{window.removeEventListener('error',error);window.removeEventListener('unhandledrejection',reject)}},[]);return null}
export class AppErrorBoundary extends Component{state={failed:false};static getDerivedStateFromError(){return {failed:true}}componentDidCatch(error){reportClientError(error)}render(){return this.state.failed?<div className="recoverypage"><section className="panel"><h1>Let’s get you back on track.</h1><p>The page hit an unexpected error. Your saved records remain in the database.</p><button className="primary" onClick={()=>window.location.reload()}>Reload the page</button><a className="button" href="/">Open read-only dashboard</a></section></div>:this.props.children}}
