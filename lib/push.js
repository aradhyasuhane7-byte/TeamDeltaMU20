import {buildPushPayload} from '@block65/webcrypto-web-push';
import {recordError} from './monitor.js';
const roles=['confirm','pack','doc','del'],labels=['Confirmation','Packaging','Documentation & Dispatch','Delivery'];
export function validateSubscription(value){
 const u=new URL(String(value?.endpoint||''));const host=u.hostname;
 const allowed=host==='fcm.googleapis.com'||host==='updates.push.services.mozilla.com'||host.endsWith('.push.services.mozilla.com')||host==='web.push.apple.com'||host.endsWith('.push.apple.com')||host.endsWith('.notify.windows.com');
 if(u.protocol!=='https:'||u.port&&u.port!=='443'||u.username||u.password||u.hash||!allowed||u.href.length>2000)throw Error('Unsupported browser push endpoint.');
 const keys=value.keys||{};if(!/^[A-Za-z0-9_-]{87}$/.test(keys.p256dh||'')||!/^B/.test(keys.p256dh)||!/^[A-Za-z0-9_-]{22}$/.test(keys.auth||''))throw Error('Invalid push subscription keys.');
 return {endpoint:u.href,keys:{p256dh:keys.p256dh,auth:keys.auth},expirationTime:null};
}
export async function sendPush(db,env,sub,data,fetcher=fetch){
 try{const subscription=validateSubscription(JSON.parse(sub.subscription));const payload=await buildPushPayload({data:JSON.stringify(data),options:{ttl:86400}},subscription,{subject:'mailto:aradhyasuhane7@gmail.com',publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY});
 const response=await fetcher(subscription.endpoint,{...payload,redirect:'error',signal:AbortSignal.timeout(8000)});
 if(response.status===404||response.status===410){await db.prepare('DELETE FROM push_subscriptions WHERE id=?').bind(sub.id).run();return false}
 if(!response.ok)throw Error('Push provider returned '+response.status);return true;
 }catch(e){await recordError(db,sub.workspace,'push-delivery',new Error('Browser push could not be delivered.'));return false}
}
export async function pushHandoff(c,env,order){
 if(!env.VAPID_PUBLIC_KEY||!env.VAPID_PRIVATE_KEY||order.stage<1||order.stage>4)return;
 const role=roles[order.stage],target=role||'admin';
 const subscriptions=(await c.db.prepare('SELECT p.* FROM push_subscriptions p JOIN accounts a ON a.id=p.account AND a.workspace=p.workspace JOIN members m ON m.workspace=a.workspace AND m.email=a.email WHERE p.workspace=? AND p.role=? AND m.role=p.role AND a.demo=0').bind(c.member.workspace,target).all()).results;
 const data={title:'Blindspot · '+(role?labels[order.stage]:'Delivery complete'),body:role?'An order has arrived in your department. Open Blindspot to view your queue.':'An order has completed delivery. Open Blindspot to review.',url:'/'+target,tag:'handoff-'+order.revision};
 for(let i=0;i<subscriptions.length;i+=6)await Promise.all(subscriptions.slice(i,i+6).map(s=>sendPush(c.db,env,s,data)));
}

export async function pushRework(c,env,order,rw){
 if(!env.VAPID_PUBLIC_KEY||!env.VAPID_PRIVATE_KEY)return;
 const resolved=rw.status==='resolved',targets=[...new Set(['admin',roles[rw.sourceStage],roles[order.stage]].filter(Boolean))];
 for(const target of targets){const subscriptions=(await c.db.prepare('SELECT p.* FROM push_subscriptions p JOIN accounts a ON a.id=p.account AND a.workspace=p.workspace JOIN members m ON m.workspace=a.workspace AND m.email=a.email WHERE p.workspace=? AND p.role=? AND m.role=p.role AND a.demo=0').bind(c.member.workspace,target).all()).results;
 const data={title:resolved?'Blindspot · Rework approved':rw.status==='awaiting-review'?'Blindspot · Replacement ready':'Blindspot · Order on hold',body:resolved?'Corrected evidence was approved. Open Blindspot to check remaining holds and resume work.':rw.status==='awaiting-review'?'Replacement evidence is ready for independent review. The order remains on hold.':'Evidence was rejected. Open Blindspot for the correction request.',url:'/'+target,tag:'rework-'+rw.id+'-'+order.revision};
 for(let i=0;i<subscriptions.length;i+=6)await Promise.all(subscriptions.slice(i,i+6).map(s=>sendPush(c.db,env,s,data)));}
}
