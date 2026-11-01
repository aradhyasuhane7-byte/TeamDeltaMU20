import {maskPage} from '../../../lib/data-security';
import {context,answer} from '../../../lib/server';
import {pageRows} from '../../../lib/pages';
export const dynamic='force-dynamic';
export async function GET(req){try{const c=await context(req);if(c.error)return c.error;if(!c.member)return answer({error:'Membership required.'},403);const u=new URL(req.url),table=u.searchParams.get('table')||'orders',after=(u.searchParams.get('after')||'').slice(0,150);return answer(maskPage(await pageRows(c.db,c.member.workspace,table,after,300),table,c.member.role))}catch{return answer({error:'Unable to load the next page.'},500)}}
