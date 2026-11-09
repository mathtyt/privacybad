import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { HttpError } from './security';
const directory = () => path.resolve(/* turbopackIgnore: true */ process.env.PRIVATE_STORAGE_PATH || './private-data');
function filename(key: string) { if (!/^[0-9a-f-]{36}\.jpg$/.test(key)) throw new Error('Invalid private storage key'); return path.join(/* turbopackIgnore: true */ directory(), key); }
export async function savePhoto(file: File) {
 if (!['image/jpeg','image/webp'].includes(file.type) || file.size > 1024 * 1024 || !file.size) throw new HttpError(400,'Foto inválida (máximo 1 MB).');
 let sanitized: Buffer;
 try { sanitized = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16000000 }).rotate().resize(1280,1280,{ fit:'inside',withoutEnlargement:true }).jpeg({ quality:80 }).toBuffer(); } catch { throw new HttpError(400,'Imagem inválida.'); }
 const key = `${randomUUID()}.jpg`; await mkdir(directory(), { recursive:true, mode:0o700 }); await writeFile(filename(key), sanitized, { flag:'wx',mode:0o600 }); return key;
}
export const readPhoto = (key: string) => readFile(/* turbopackIgnore: true */ filename(key));
export async function removePhoto(key: string | null) { if (!key) return; try { await unlink(filename(key)); } catch(e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; } }
