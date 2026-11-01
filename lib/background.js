import {AsyncLocalStorage} from 'node:async_hooks';
const storage=new AsyncLocalStorage();
export const runWithBackground=(ctx,fn)=>storage.run(ctx,fn);
export async function backgroundTask(task){const ctx=storage.getStore();if(ctx){ctx.waitUntil(task);return}await task}
