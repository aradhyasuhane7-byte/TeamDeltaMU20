import {env} from 'cloudflare:workers';
import {answer,originOK} from '../../../lib/server';
import {digest,same,passwordHash} from '../../../lib/auth';
import {allowRequest} from '../../../lib/rate';
export const dynamic='force-dynamic';

export async function POST(req){try{
 if(!originOK(req))return answer({error:'Invalid request origin.'},403);
 if(Number(req.headers.get('content-length'))>2048)return answer({error:'Request too large.'},413);
 if(!await allowRequest(env.DB,req,'prepared-logins',10))return answer({error:'Too many attempts. Try again in one hour.'},429);
 const config=JSON.parse(env.BLINDSPOT_PREPARED_LOGIN_CONFIG||'null');
 if(!config?.codeHash||!Array.isArray(config.accounts))return answer({error:'Prepared logins have not been configured.'},503);
 const b=await req.json(),code=String(b.code||'').trim();
 if(code.length>100||!same(await digest(code),config.codeHash))return answer({error:'The private access code is incorrect.'},401);
 const credentials=[];
 for(const entry of config.accounts){
  const account=await env.DB.prepare('SELECT a.hash,a.salt,m.role FROM accounts a JOIN members m ON m.workspace=a.workspace AND m.email=a.email WHERE a.username=? AND a.demo=0').bind(entry.username).first();
  if(!account||account.role!==entry.role)return answer({error:'A prepared account is unavailable. Contact your admin.'},409);
  const unchanged=same(await passwordHash(entry.password,account.salt),account.hash);
  credentials.push({role:entry.role,username:entry.username,...(unchanged?{password:entry.password}:{changed:true})});
 }
 return answer({credentials});
}catch{return answer({error:'Unable to load prepared logins. Please retry.'},500)}}
