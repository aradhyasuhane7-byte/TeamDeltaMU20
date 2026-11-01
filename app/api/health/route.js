import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';
export async function GET(){try{await env.DB.prepare('SELECT 1 AS ok').first();return Response.json({ok:true,database:'reachable',at:Date.now()},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({ok:false,database:'unavailable'},{status:503})}}
