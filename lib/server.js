import {encryptedDB,encryptedBucket} from './data-security';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../app/chatgpt-auth';
import {appUser,sessionToken} from './auth';
import {settings} from './core';
export const answer=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function context(req){
 const expectedAccount=req.headers.get('x-blindspot-account'),expectedRole=req.headers.get('x-blindspot-role');
 const app=await appUser(req);
 if(!app&&(sessionToken(req)||expectedAccount||expectedRole))return {error:answer({error:'Your department session expired or could not be verified. Please log in again.'},401)};
 if(app&&expectedAccount&&app.username!==expectedAccount.toLowerCase())return {error:answer({error:'The active account changed. Please log in again.'},401)};
 if(app&&expectedRole&&app.sessionRole!==expectedRole)return {error:answer({error:'The active department changed. Please log in again.'},401)};
 const user=app||await getChatGPTUser();if(!user)return {error:answer({error:'Sign in to continue.'},401)};
 const email=user.email.toLowerCase(),db=env.DB;
 const ms=(await (user.app?db.prepare('SELECT m.*,w.name,w.settings FROM members m JOIN workspaces w ON w.id=m.workspace WHERE m.email=? AND m.workspace=?').bind(email,user.workspace):db.prepare('SELECT m.*,w.name,w.settings FROM members m JOIN workspaces w ON w.id=m.workspace WHERE m.email=?').bind(email)).all()).results;
 const wid=new URL(req.url).searchParams.get('workspace'),member=ms.find(m=>m.workspace===wid)||(!wid?ms[0]:null);
 if(user.app&&(!member||member.role!==user.sessionRole))return {error:answer({error:'Your department permissions changed. Please log in again.'},403)};
 return {user,email,rawDB:db,rawBucket:env.BUCKET,db:encryptedDB(db,env.DATA_ENCRYPTION_KEY,member?.workspace||''),ms,member,config:settings(member?.settings),bucket:encryptedBucket(env.BUCKET,env.DATA_ENCRYPTION_KEY)}
}

export function originOK(req){return req.headers.get('origin')===new URL(req.url).origin}
export function eventStatement(db,wid,oid,actor,label,revision,now=Date.now()){return db.prepare('INSERT INTO events(id,workspace,order_id,actor,action,at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM orders WHERE id=? AND workspace=? AND revision=?)').bind(crypto.randomUUID(),wid,oid,actor,label,now,oid,wid,revision)}
export function updateStatement(db,o,revision){return db.prepare('UPDATE orders SET number=?,buyer=?,product=?,quantity=?,destination=?,stage=?,entered=?,limits=?,done=?,reason=?,tracking=?,courier=?,revision=?,meta=?,deleted=? WHERE id=? AND workspace=? AND revision=?').bind(o.number,o.buyer,o.product,o.quantity,o.destination,o.stage,o.entered,o.limits,o.done,o.reason,o.tracking,o.courier,o.revision,o.meta,o.deleted||0,o.id,o.workspace,revision)}
export function insertStatement(db,o){return db.prepare('INSERT INTO orders(id,workspace,number,buyer,product,quantity,destination,stage,entered,created,limits,done,reason,tracking,courier,revision,meta,deleted) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(o.id,o.workspace,o.number,o.buyer,o.product,o.quantity,o.destination,o.stage,o.entered,o.created,o.limits,o.done,o.reason,o.tracking,o.courier,o.revision,o.meta,o.deleted||0)}
