import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
const files=fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort();
const sql=new DatabaseSync(':memory:');for(const n of files)sql.exec(fs.readFileSync('drizzle/'+n,'utf8'));
const db={prepare(query){let args=[];return {bind(...values){args=values;return this},async first(){return sql.prepare(query).get(...args)||null},async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:Number(r.changes)}}}}},async batch(statements){sql.exec('BEGIN');try{for(const s of statements)await s.run();sql.exec('COMMIT')}catch(e){sql.exec('ROLLBACK');throw e}}};
const strip=s=>s.replace(/^import .*;\n/gm,'').replaceAll('export async function ','async function ').replaceAll('export function ','function ').replaceAll('export const ','const ').replaceAll('import.meta.env.DEV','true');
const auth=new Function(strip(fs.readFileSync('lib/auth.js','utf8'))+';return {passwordHash,same,digest,salt,sessionCookie,sessionToken}')();
const fixtureCode='private-test-only-code',accounts=['admin','confirm','pack','doc','del'].map(role=>({role,username:'bs.'+role,password:'TestOnly!'+role+'-StrongPassword'}));
for(const a of accounts){const hash=await auth.passwordHash(a.password,'test-only-salt');sql.prepare('UPDATE accounts SET hash=?,salt=? WHERE username=?').run(hash,'test-only-salt',a.username)}
const env={DB:db,BLINDSPOT_PREPARED_LOGIN_CONFIG:JSON.stringify({codeHash:createHash('sha256').update(fixtureCode).digest('hex'),accounts})};
let allowed=true;const answer=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}}),originOK=r=>r.headers.get('origin')===new URL(r.url).origin;
const api=new Function('env','answer','originOK','digest','same','passwordHash','allowRequest',strip(fs.readFileSync('app/api/prepared-logins/route.js','utf8'))+';return {POST}')(env,answer,originOK,auth.digest,auth.same,auth.passwordHash,async()=>allowed);
const get=(code=fixtureCode,origin='https://test.local')=>api.POST(new Request('https://test.local/api/prepared-logins',{method:'POST',headers:{origin},body:JSON.stringify({code})}));
assert.equal((await get('wrong')).status,401);assert.equal((await get(fixtureCode,'https://other.local')).status,403);
allowed=false;assert.equal((await get()).status,429);allowed=true;
let response=await get();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const found=await response.json();assert.equal(found.credentials.length,5);assert.deepEqual(found.credentials,accounts);
const login=new Function('env','passwordHash','same','digest','salt','sessionCookie','sessionToken','roles','answer','securityAlert',strip(fs.readFileSync('app/api/login/route.js','utf8'))+';return {POST}')(env,auth.passwordHash,auth.same,auth.digest,auth.salt,auth.sessionCookie,auth.sessionToken,accounts.map(a=>a.role),answer,async()=>{});
for(const account of accounts){response=await login.POST(new Request('https://test.local/api/login',{method:'POST',headers:{origin:'https://test.local'},body:JSON.stringify(account)}));assert.equal(response.status,200);assert.equal((await response.json()).role,account.role)}
response=await login.POST(new Request('https://test.local/api/login',{method:'POST',headers:{origin:'https://test.local'},body:JSON.stringify({...accounts[2],role:'confirm'})}));assert.equal(response.status,401);
sql.prepare("UPDATE accounts SET hash=? WHERE username='bs.pack'").run(await auth.passwordHash('ChangedPassword!','test-only-salt'));response=await get();const changed=(await response.json()).credentials.find(a=>a.role==='pack');assert(changed.changed);assert(!('password' in changed));
assert.equal(sql.prepare("SELECT count(*) AS n FROM orders WHERE workspace='blindspot-business'").get().n,0);
// If the owner already has a business, provision there without duplicating or changing its records.
const existing=new DatabaseSync(':memory:');for(const n of files.filter(n=>!n.startsWith('0009_')))existing.exec(fs.readFileSync('drizzle/'+n,'utf8'));
existing.exec("INSERT INTO workspaces(id,name,owner,settings) VALUES('existing-business','Existing','verified-owner','{}'); INSERT INTO members(id,workspace,email,role) VALUES('owner','existing-business','aradhyasuhane7@gmail.com','admin');");existing.exec(fs.readFileSync('drizzle/0009_prepared_department_logins.sql','utf8'));
assert.equal(existing.prepare("SELECT count(*) AS n FROM accounts WHERE workspace='existing-business'").get().n,5);assert.equal(existing.prepare("SELECT id FROM workspaces WHERE id='blindspot-business'").get(),undefined);
console.log('Passed private-code checks, origin/rate limits, all five actual login roles, role mismatch rejection, hidden rotated passwords, empty business queue and existing-workspace preservation.');
