import {json,meta,elapsed,workMinutes,settings,activeReworks,stages} from './core.js';
const DAY=86400000;
export const quantile=(sorted,p)=>{const x=(sorted.length-1)*p,a=Math.floor(x);return sorted[a]+(sorted[Math.ceil(x)]-sorted[a])*(x-a)};
export function workingETA(now,minutes,config){if(minutes<=0)return now;let lo=now,hi=now+400*DAY;if(workMinutes(now,hi,config)<minutes)return null;for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(workMinutes(now,mid,config)<minutes)lo=mid;else hi=mid}return Math.ceil(hi)}
export function stageHistory(orders,config,now=Date.now()){
 const buckets=Array.from({length:4},()=>[]);
 for(const o of orders){const m=meta(o);for(const [i,d] of json(o.done,[]).entries()){
  if(i>3||!d||d.manual||String(d.actor||'').includes('Imported legacy')||(m.reworks||[]).some(r=>r.sourceStage===i)||!Number.isFinite(d.started)||!Number.isFinite(d.at)||d.at<now-90*DAY||d.at>now||d.started>d.at)continue;
  let minutes=workMinutes(d.started,d.at,config);for(const p of m.pauses||[])if(Number.isFinite(p.start))minutes-=workMinutes(Math.max(d.started,p.start),Math.min(d.at,p.end||d.at),config);
  if(minutes>0)buckets[i].push({minutes,at:d.at});
 }}return buckets.map(b=>b.sort((a,b)=>b.at-a.at).slice(0,200).map(x=>x.minutes).sort((a,b)=>a-b));
}
export function predictOrders(historyOrders,visibleOrders,config,now=Date.now()){
 // Caller supplies one authenticated workspace. Defensively scope training per order too.
 const models=new Map();return visibleOrders.filter(o=>!o.deleted&&o.stage<4).map(o=>{
  const key=o.workspace||'';if(!models.has(key))models.set(key,stageHistory(historyOrders.filter(x=>(x.workspace||'')===key),config,now));
  const samples=models.get(key)[o.stage],used=elapsed(o,now,config),limit=json(o.limits,[])[o.stage]*settings(config).peak;
  const base={id:o.id,number:o.number,stage:o.stage,samples:samples.length,used,limit};
  if(activeReworks(o).length)return {...base,state:'On hold',reason:'Resolve every evidence hold before forecasting completion.'};
  if(meta(o).supplier)return {...base,state:'Paused',reason:'Resume the supplier clock before forecasting completion.'};
  if(samples.length<5)return {...base,state:'Learning',reason:'At least 5 eligible stage completions are required.'};
  const remaining=samples.filter(v=>v>used).map(v=>v-used);
  if(remaining.length<5)return {...base,state:'Outside baseline',comparable:remaining.length,reason:'Fewer than 5 historical completions lasted longer than the time already used. No reliable remaining-time estimate.'};
  const median=quantile(remaining,.5),low=quantile(remaining,.1),high=quantile(remaining,.9),lateShare=used>=limit?1:remaining.filter(v=>v+used>limit).length/remaining.length;
  return {...base,state:used>=limit?'Deadline reached':lateShare>=.6?'High delay risk':lateShare>=.3?'Watch':'Lower delay risk',comparable:remaining.length,remaining:median,low,high,eta:workingETA(now,median,config),lateShare,stageName:stages[o.stage]};
 });
}

export function historicalPredictions(orders,config,now=Date.now()){
 const history=stageHistory(orders,config,now),stageRows=history.map((values,stage)=>({stage,count:values.length,median:values.length>=5?quantile(values,.5):null,late:0,reviewed:0}));
 // Match the same latest-200 eligible records used by stageHistory.
 for(let stage=0;stage<4;stage++){
  const eligible=orders.filter(o=>stageHistory([o],config,now)[stage].length).sort((a,b)=>json(b.done,[])[stage].at-json(a.done,[])[stage].at).slice(0,200);
  for(const o of eligible){const d=json(o.done,[])[stage];if(Number.isFinite(d.lost)&&d.lost>=0){stageRows[stage].reviewed++;if(d.lost>0)stageRows[stage].late++}}
 }
 const grouped=new Map();for(const o of orders){
  const name=String(o.destination||'').trim().replace(/\s+/g,' '),d=json(o.done,[]),last=d[3];
  if(!name||o.stage!==4||activeReworks(o).length||!Number.isFinite(o.created)||!last||o.created>last.at||d.length!==4||d.some((x,i)=>!x||x.manual||!stageHistory([o],config,now)[i].length))continue;
  let total=workMinutes(o.created,last.at,config);for(const p of meta(o).pauses||[])if(Number.isFinite(p.start))total-=workMinutes(Math.max(o.created,p.start),Math.min(last.at,p.end||last.at),config);
  if(total<=0)continue;const key=(o.workspace||'')+'|'+name.toLowerCase(),g=grouped.get(key)||{destination:name,values:[]};g.values.push({total,delivery:stageHistory([o],config,now)[3][0],at:last.at});grouped.set(key,g);
 }
 const destinations=[...grouped.values()].map(g=>{const records=g.values.sort((a,b)=>b.at-a.at).slice(0,200),totals=records.map(x=>x.total).sort((a,b)=>a-b),delivery=records.map(x=>x.delivery).sort((a,b)=>a-b),count=totals.length;return {destination:g.destination,count,median:count>=5?quantile(totals,.5):null,low:count>=5?quantile(totals,.1):null,high:count>=5?quantile(totals,.9):null,delivery:count>=5?quantile(delivery,.5):null}}).sort((a,b)=>b.count-a.count||a.destination.localeCompare(b.destination));
 const ranked=stageRows.filter(r=>r.reviewed>=5).sort((a,b)=>b.late/b.reviewed-a.late/a.reviewed||b.late-a.late);
 return {stages:stageRows,bottleneck:ranked[0]?.late?ranked[0]:null,destinations};
}
