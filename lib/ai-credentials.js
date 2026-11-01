export function hasAIKey(env){return Boolean(env.OPENAI_API_KEY||(env.OPENAI_KEY_CIPHERTEXT&&env.OPENAI_KEY_JWK))}
export async function getAIKey(env){
 if(env.OPENAI_API_KEY)return env.OPENAI_API_KEY;
 if(!hasAIKey(env))return null;
 const jwk=JSON.parse(env.OPENAI_KEY_JWK);
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSA-OAEP',hash:'SHA-256'},false,['decrypt']);
 const encoded=env.OPENAI_KEY_CIPHERTEXT.replace(/-/g,'+').replace(/_/g,'/');
 const bytes=Uint8Array.from(atob(encoded.padEnd(Math.ceil(encoded.length/4)*4,'=')),c=>c.charCodeAt(0));
 const raw=new TextDecoder().decode(await crypto.subtle.decrypt({name:'RSA-OAEP'},key,bytes));
 if(!/^sk-[A-Za-z0-9_-]+$/.test(raw))throw Error('AI credentials could not be loaded.');
 return raw;
}
