import {env} from 'cloudflare:workers';
import {pushRework} from '../../../lib/push';
import {backgroundTask} from '../../../lib/background';
import {json,meta,id} from '../../../lib/core';
import {context,answer,originOK} from '../../../lib/server';
import {acquire,release} from '../../../lib/lease';
import {canReviewPhoto} from '../../../lib/photo-evidence';
import {changeBackup} from '../../../lib/backup';
import {recordError} from '../../../lib/monitor';
export const dynamic='force-dynamic';
export async function POST(req){let c,lease;try{
 if(!originOK(req))return answer({error:'Invalid origin.'},403);
 const raw=await req.text();if(raw.length>4000)return answer({error:'Request too large.'},413);const b=JSON.parse(raw);
 c=await context(req);if(c.error)return c.error;if(!c.member||!c.user.app)return answer({error:'Department login required.'},401);
 lease=await acquire(c.db,c.member.workspace);
 const p=await c.db.prepare('SELECT * FROM photos WHERE id=? AND workspace=?').bind(String(b.id||''),c.member.workspace).first();if(!p)return answer({error:'Photo not found.'},404);
 if(!canReviewPhoto(p,c.user,c.member))return answer({error:'A different admin or the receiving department must review this photo. Uploaders cannot approve or reject their own evidence.'},403);
 const o=await c.db.prepare('SELECT * FROM orders WHERE id=? AND workspace=?').bind(p.order_id,c.member.workspace).first();if(!o||o.deleted)return answer({error:'Restore this order before reviewing evidence.'},409);
 if(p.review)return answer({error:'This photo already has a final review. Upload new evidence for a new review.'},409);
 if(!['approved','rejected'].includes(b.status)||b.checked!==true)return answer({error:'Inspect the photo against the order and confirm the checklist.'},400);
 const note=String(b.note||'').trim().slice(0,500);if(b.status==='rejected'&&!note)return answer({error:'Explain why the evidence was rejected.'},400);
 const at=Date.now(),review=JSON.stringify({status:b.status,actor:c.email,account:c.user.userId,at,note});
 const m=meta(o),receipt=json(p.evidence,{});m.reworks=m.reworks||[];
 let rw=receipt.reworkId?m.reworks.find(r=>r.id===receipt.reworkId):null;
 if(receipt.reworkId&&(!rw||rw.status==='resolved'||rw.latestPhoto!==p.id))return answer({error:'This replacement is no longer the active evidence. Review the latest replacement.'},409);
 if(b.status==='rejected'){
  if(!rw){rw={id:id(),sourceStage:p.stage,originalPhoto:p.id,created:at,requestedBy:c.email,history:[]};m.reworks.push(rw)}
  rw.status='awaiting-evidence';rw.reason=note;rw.updated=at;rw.history.push({at,actor:c.email,action:'rejected',photo:p.id,note});
 }else if(rw){rw.updated=at;rw.status='resolved';rw.resolved=at;rw.resolvedBy=c.email;rw.history.push({at,actor:c.email,action:'approved',photo:p.id,note})}
 const revision=id();
 await c.db.batch([c.db.prepare('UPDATE orders SET meta=?,revision=? WHERE id=? AND workspace=?').bind(JSON.stringify(m),revision,o.id,c.member.workspace),c.db.prepare('UPDATE photos SET review=? WHERE id=? AND workspace=? AND review=?').bind(review,p.id,c.member.workspace,''),c.db.prepare('INSERT INTO events(id,workspace,order_id,actor,action,at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),c.member.workspace,p.order_id,c.email,'Photo evidence '+b.status+' · receipt '+p.id+(note?' · '+note:''),at)]);
 if(rw)await backgroundTask(pushRework(c,env,{...o,revision},rw));
 let warning='';try{await changeBackup(c,{action:'photo-review',id:p.order_id},at)}catch{warning='Review saved, but its recovery record failed. Check Error monitoring.';await recordError(c.db,c.member.workspace,'photo-review-backup',new Error(warning))}
 return answer({ok:true,warning});
}catch{return answer({error:'Photo review could not be saved. Refresh and retry.'},500)}finally{if(lease)await release(c.db,lease)}}
