import {env} from 'cloudflare:workers';
import {context,answer,originOK} from '../../../lib/server';
import {digest} from '../../../lib/auth';
import {allowRequest} from '../../../lib/rate';
import {validateSubscription,sendPush} from '../../../lib/push';
export const dynamic='force-dynamic';
async function access(req){const c=await context(req);if(c.error)return c;if(!c.user.app||!c.member)return {error:answer({error:'Log in with your department account to manage notifications.'},401)};return c}
export async function GET(req){try{const c=await access(req);if(c.error)return c.error;return answer({publicKey:env.VAPID_PUBLIC_KEY||null,configured:!!(env.VAPID_PUBLIC_KEY&&env.VAPID_PRIVATE_KEY)})}catch{return answer({error:'Unable to load push settings.'},500)}}
export async function POST(req){try{
 if(!originOK(req))return answer({error:'Invalid origin.'},403);if(Number(req.headers.get('content-length'))>5000)return answer({error:'Request too large.'},413);
 const c=await access(req);if(c.error)return c.error;if(!await allowRequest(c.db,req,'push-settings',30))return answer({error:'Too many requests. Try later.'},429);
 const raw=await req.text();if(raw.length>5000)return answer({error:'Request too large.'},413);const b=JSON.parse(raw);
 if(b.action==='disable'){await c.db.prepare('DELETE FROM push_subscriptions WHERE id=? AND workspace=? AND account=?').bind(await digest(String(b.endpoint)),c.member.workspace,c.user.userId).run();return answer({ok:true})}
 if(!env.VAPID_PUBLIC_KEY||!env.VAPID_PRIVATE_KEY)return answer({error:'Browser push is not configured.'},503);
 if(b.action==='test'){const s=await c.db.prepare('SELECT * FROM push_subscriptions WHERE id=? AND workspace=? AND account=? AND role=?').bind(await digest(String(b.endpoint)),c.member.workspace,c.user.userId,c.member.role).first();if(!s)return answer({error:'Enable notifications on this device first.'},404);const sent=await sendPush(c.db,env,s,{title:'Blindspot test notification',body:'This device is ready for department handoff alerts.',url:'/'+c.member.role,tag:'blindspot-test'});return sent?answer({ok:true,message:'Test accepted by your browser push service. Check your device notifications.'}):answer({error:'Push delivery failed. Check browser permissions and try enabling again.'},502)}
 if(b.action!=='subscribe')return answer({error:'Unknown action.'},400);const sub=validateSubscription(b.subscription);await crypto.subtle.importKey('raw',Uint8Array.from(atob(sub.keys.p256dh.replace(/-/g,'+').replace(/_/g,'/')+'='),x=>x.charCodeAt(0)),{name:'ECDH',namedCurve:'P-256'},false,[]);
 await c.db.prepare('INSERT INTO push_subscriptions(id,workspace,account,role,endpoint,subscription,created) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET workspace=excluded.workspace,account=excluded.account,role=excluded.role,endpoint=excluded.endpoint,subscription=excluded.subscription,created=excluded.created').bind(await digest(sub.endpoint),c.member.workspace,c.user.userId,c.member.role,sub.endpoint,JSON.stringify(sub),Date.now()).run();return answer({ok:true});
}catch{return answer({error:'Unable to save this browser subscription. Try again using a supported browser.'},400)}}
