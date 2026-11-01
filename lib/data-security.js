// Application-level AES-256-GCM. The key belongs in runtime secrets, never source.
const enc=new TextEncoder(),dec=new TextDecoder(),prefix='bsenc:v1:';
const fields={orders:['buyer','destination','meta','done','reason'],events:['action'],photos:['evidence','review']};
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),b64=b=>btoa(String.fromCharCode(...b));
async function key(secret){if(!/^[a-f0-9]{64}$/i.test(secret||''))throw Error('Data encryption key is unavailable.');return crypto.subtle.importKey('raw',Uint8Array.from(secret.match(/../g),x=>parseInt(x,16)),{name:'AES-GCM'},false,['encrypt','decrypt'])}
export async function seal(value,secret,aad){if(value==='')return value;const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(aad)},await key(secret),enc.encode(value)));return prefix+b64(iv)+':'+btoa(Array.from({length:Math.ceil(cipher.length/16384)},(_,i)=>String.fromCharCode(...cipher.slice(i*16384,(i+1)*16384))).join(''))}

export async function unseal(value,secret,aad){if(typeof value!=='string'||!value.startsWith(prefix))return value;const [iv,payload]=value.slice(prefix.length).split(':');return dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv),additionalData:enc.encode(aad)},await key(secret),bytes(payload)))}
export function encryptedDB(raw,secret,workspace){
 function statement(sql){let args=[];const table=sql.match(/(?:INTO|UPDATE|FROM)\s+(orders|events|photos)\b/i)?.[1]?.toLowerCase(),sensitive=fields[table]||[];
  async function materialize(){const values=[...args],insert=sql.match(/INSERT(?: OR \w+)? INTO \w+\s*\(([^)]+)\)/i);if(insert){insert[1].split(',').map(x=>x.trim()).forEach((col,i)=>{if(sensitive.includes(col))values[i]={encrypt:values[i],col}})}else if(/^UPDATE /i.test(sql)){const sets=sql.split(/\bSET\b/i)[1]?.split(/\bWHERE\b/i)[0]||'';let index=0;for(const part of sets.split(',')){const col=part.trim().match(/^(\w+)\s*=\s*\?$/)?.[1];if(col&&sensitive.includes(col))values[index]={encrypt:values[index],col};index+=(part.match(/\?/g)||[]).length}}
   for(let i=0;i<values.length;i++)if(values[i]&&typeof values[i]==='object'&&'encrypt'in values[i])values[i]=await seal(String(values[i].encrypt??''),secret,workspace+'/'+table+'/'+values[i].col);
   return raw.prepare(sql).bind(...values);
  }
  async function row(r){if(!r)return r;const out={...r};for(const col of sensitive)if(col in out)out[col]=await unseal(out[col],secret,workspace+'/'+table+'/'+col);return out}
  return {bind(...v){args=v;return this},materialize,async first(col){const r=await row(await (await materialize()).first());return col?r?.[col]??null:r},async all(){const result=await(await materialize()).all();return {...result,results:await Promise.all(result.results.map(row))}},async run(){return(await materialize()).run()}};
 }
 return {prepare:statement,async batch(ss){return raw.batch(await Promise.all(ss.map(s=>s.materialize())))}};
}
export function encryptedBucket(raw,secret){if(!raw)return raw;return {async put(path,value,options){const data=typeof value==='string'?value:await new Response(value).text();if(options?.httpMetadata?.contentType==='application/json')return raw.put(path,await seal(data,secret,'object/'+path),options);return raw.put(path,value,options)},async get(path){const obj=await raw.get(path);if(!obj)return null;if(obj.httpMetadata?.contentType!=='application/json')return obj;const text=await unseal(await obj.text(),secret,'object/'+path);return {...obj,httpMetadata:obj.httpMetadata,text:async()=>text,json:async()=>JSON.parse(text),arrayBuffer:async()=>enc.encode(text).buffer}},delete:path=>raw.delete(path)}}
export function maskOrder(o,role){if(role==='admin')return o;const m=JSON.parse(o.meta||'{}'),out={...o};delete m.notes;delete m.manual;if(!['confirm'].includes(role)){m.value=0;delete m.rating}if(role==='pack'){out.buyer='[Restricted]';out.destination='[Restricted]';m.phone='';}out.meta=JSON.stringify(m);out.sensitiveAccess={contacts:role!=='pack',financial:role==='confirm'};return out}
export function maskPage(page,table,role){if(role==='admin')return page;return {...page,rows:page.rows.map(r=>table==='orders'?maskOrder(r,role):table==='events'?{...r,action:'Order activity · details restricted'}:r)}}
