import {context,answer,originOK} from '../../../lib/server';
import {createAccount,salt} from '../../../lib/auth';
import {roles} from '../../../lib/core';
import {acquire,renew,release} from '../../../lib/lease';
export const dynamic='force-dynamic';

export async function POST(req){
 let c,lease;
 try{
  if(!originOK(req))return answer({error:'Invalid request origin.'},403);
  c=await context(req);if(c.error)return c.error;
  if(!c.member||c.member.role!=='admin'||c.user.demo)return answer({error:'Business admin access required.'},403);
  const wid=c.member.workspace;
  const workspace=await c.db.prepare('SELECT owner FROM workspaces WHERE id=?').bind(wid).first();
  if(!workspace||!c.user.app&&workspace.owner!==c.user.userId)return answer({error:'Only the verified business owner can initialize logins.'},403);
  lease=await acquire(c.db,wid);
  const credentials=[],statements=[];
  const suffix=salt().slice(0,16);
  for(const role of roles){
   const existing=await c.db.prepare('SELECT a.username FROM accounts a JOIN members m ON m.workspace=a.workspace AND m.email=a.email WHERE a.workspace=? AND m.role=? AND a.demo=0 ORDER BY a.username LIMIT 1').bind(wid,role).first();
   if(existing){credentials.push({role,username:existing.username,existing:true});continue}
   const username=role+'.'+suffix;
   // Department slots use internal identifiers; individual employees can be added separately.
   const email=role==='admin'?c.email:username+'@accounts.blindspot.invalid';
   const password='Bs!'+salt();
   statements.push(await createAccount(c.db,username,email,password,wid));
   if(role!=='admin')statements.push(c.db.prepare('INSERT INTO members(id,workspace,email,role) VALUES(?,?,?,?)').bind(crypto.randomUUID(),wid,email,role));
   credentials.push({role,username,password,existing:false});
  }
  if(statements.length){
   statements.push(c.db.prepare('INSERT INTO events(id,workspace,order_id,actor,action,at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),wid,'workspace',c.email,'Starter logins created for: '+credentials.filter(x=>!x.existing).map(x=>x.role).join(', '),Date.now()));
   await renew(c.db,lease);
   await c.db.batch(statements);
  }
  return answer({ok:true,credentials});
 }catch{return answer({error:'Unable to prepare logins. Refresh and retry; existing passwords are never replaced.'},500)}
 finally{if(lease)await release(c.db,lease)}
}
