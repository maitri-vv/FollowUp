import { Memory } from './types';
const DB='followup-db'; const STORE='memories';
function open(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function saveMemories(items:Memory[]){const db=await open();await new Promise<void>((res,rej)=>{const tx=db.transaction(STORE,'readwrite');for(const i of items)tx.objectStore(STORE).put(i);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});db.close();}
export async function loadMemories(){const db=await open();const data=await new Promise<Memory[]>((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});db.close();return data;}
export async function clearMemories(){const db=await open();await new Promise<void>((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});db.close();}
