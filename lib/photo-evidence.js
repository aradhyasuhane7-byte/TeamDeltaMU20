import {roles} from './core.js';
export function canReviewPhoto(photo,user,member){return !!user?.app&&!!member&&String(photo.actor).toLowerCase()!==String(user.email).toLowerCase()&&['admin',roles[photo.stage+2]].filter(Boolean).includes(member.role)}
export async function fingerprintPhoto(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')}
export function photoReceipt(order){return JSON.stringify({version:1,number:order.number,product:order.product,quantity:order.quantity,revision:order.revision})}
