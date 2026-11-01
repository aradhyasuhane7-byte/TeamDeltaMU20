import {json,meta,roles,stages,orderStatus} from './core.js';
export function delayInsights(orders,now=Date.now()){
 const offset=19800000,local=new Date(now+offset),day=(local.getUTCDay()+6)%7;
 const start=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate()-day)-offset,week=7*86400000;
 const current=Array.from({length:4},()=>({count:0,late:0,minutes:0,examples:[]})),previous=structuredClone(current),reasons=new Map();
 for(const o of orders)for(const [i,d] of json(o.done,[]).entries()){
  if(i>3||d.manual||!Number.isFinite(d.at)||d.at>now)continue;
  const bucket=d.at>=start?current:d.at>=start-week&&d.at<=now-week?previous:null;
  if(!bucket)continue;const lost=Math.max(0,Number(d.lost)||0);bucket[i].count++;bucket[i].minutes+=lost;
  if(lost>0){bucket[i].late++;if(bucket[i].examples.length<5)bucket[i].examples.push(o.number)}
  if(bucket===current&&lost>0){const label=String(d.reason||'Reason not recorded').trim()||'Reason not recorded',key=i+':'+label.toLowerCase().replace(/\s+/g,' ');const r=reasons.get(key)||{stage:i,label,count:0,minutes:0,orders:[]};r.count++;r.minutes+=lost;if(r.orders.length<5)r.orders.push(o.number);reasons.set(key,r)}
 }
 const rows=current.map((x,i)=>({...x,stage:stages[i],average:x.count?x.minutes/x.count:0,previous:previous[i],change:previous[i].count&&x.count?x.minutes/x.count-previous[i].minutes/previous[i].count:null}));
 const ranked=rows.filter(x=>x.count).sort((a,b)=>b.average-a.average||b.minutes-a.minutes);
 return {start,end:now,previousStart:start-week,previousEnd:now-week,rows,slowest:ranked[0]?.minutes>0?ranked[0]:null,reasons:[...reasons.values()].sort((a,b)=>b.count-a.count||b.minutes-a.minutes)};
}
export function departmentNotifications(orders,role,config){
 const list=[];function add(o,id,stage,at,title){if(role==='admin'||roles[stage+1]===role)list.push({id,orderId:o.id,number:o.number,stage,at,title})}
 for(const o of orders){if(o.deleted)continue;add(o,'new:'+o.id,0,o.created,'Order received · Confirmation queue');
 for(const [i,d] of json(o.done,[]).entries()){if(i>3||!Number.isFinite(d.at)||d.manual&&i<3)continue;add(o,'handoff:'+o.id+':'+i+':'+d.at,i+1,d.at,i===3?'Delivery completed':'Ready for '+stages[i+1]);}
 for(const r of meta(o).reworks||[]){if(role==='admin'||role===roles[r.sourceStage+1]||role===roles[o.stage+1])list.push({id:'rework:'+r.id+':'+r.updated,orderId:o.id,number:o.number,stage:r.sourceStage,at:r.updated,title:r.status==='resolved'?'Corrected evidence approved':r.status==='awaiting-review'?'On hold · Replacement awaiting review':'On hold · '+stages[r.sourceStage]+' correction required'});}
 if(o.stage<4&&orderStatus(o,config)==='Overdue')add(o,'overdue:'+o.id+':'+o.stage+':'+o.entered,o.stage,o.entered,'Overdue at '+stages[o.stage]);
 }
 return list.sort((a,b)=>b.at-a.at||a.id.localeCompare(b.id));
}
