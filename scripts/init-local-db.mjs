import {existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync,renameSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
if(!existsSync('dist/server/wrangler.json'))throw Error('Run the build first: npm run build');
const directory=path.resolve('.sites-runtime');mkdirSync(directory,{recursive:true});const statePath=path.join(directory,'local-migrations.json');const applied=existsSync(statePath)?JSON.parse(readFileSync(statePath,'utf8')):[];
for(const name of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort()){if(applied.includes(name))continue;const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file','drizzle/'+name],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);applied.push(name);writeFileSync(statePath+'.tmp',JSON.stringify(applied,null,2));renameSync(statePath+'.tmp',statePath)}
console.log('Local database is ready. Production data is unchanged.');
