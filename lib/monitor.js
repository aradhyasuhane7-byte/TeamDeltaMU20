import {cleanError} from './operations';
export async function recordError(db,workspace,scope,error){try{await db.prepare('INSERT INTO runtime_errors(id,workspace,scope,message,created,resolved) VALUES(?,?,?,?,?,0)').bind(crypto.randomUUID(),workspace||'public',String(scope).slice(0,80),cleanError(error?.message||error),Date.now()).run()}catch{}}
