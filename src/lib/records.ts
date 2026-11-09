import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { db } from './db';
import { removePhoto } from './storage';
export async function deleteRecord(id: string) {
 const record = await db.participation.findUnique({ where:{ id } });
 if (!record) return false;
 // Delete file first: failures preserve the row for an idempotent cleanup retry.
 await removePhoto(record.photoStorageKey);
 await db.participation.deleteMany({ where:{ id } }); return true;
}
export async function removeOrphans() {
 const directory=path.resolve(/* turbopackIgnore: true */ process.env.PRIVATE_STORAGE_PATH||'./private-data');
 let files: string[];
 try { files=await readdir(/* turbopackIgnore: true */ directory); } catch(e) { if((e as NodeJS.ErrnoException).code==='ENOENT')return;throw e; }
 for(const file of files){
 if(!/^[0-9a-f-]{36}\.jpg$/.test(file))continue;
 let modified: number;try{modified=(await stat(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ directory,file))).mtimeMs;}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')continue;throw e;}
 // In-flight uploads cannot be mistaken for orphans. Files without a committed row also expire.
 if(Date.now()-modified<86400000)continue;
 if(!await db.participation.findUnique({where:{photoStorageKey:file},select:{id:true}}))await removePhoto(file);
 }
}
export async function cleanup() {
 const expired = await db.participation.findMany({ where:{ expiresAt:{ lte:new Date() } }, select:{ id:true }, take:500 });
 for (const record of expired) await deleteRecord(record.id);
 await db.rateLimit.deleteMany({ where:{ resetAt:{ lt:new Date() } } });
 await removeOrphans();
 return expired.length;
}
