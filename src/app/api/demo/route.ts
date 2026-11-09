import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { route, sameOrigin, limited, body, HttpError, audit } from '@/lib/security';
import { demoSchema } from '@/lib/validation';
import { savePhoto, removePhoto } from '@/lib/storage';
import { cleanup } from '@/lib/records';
export const runtime = 'nodejs';
export const POST = route(async req => {
 sameOrigin(req); await limited('demo',60,60); await cleanup();
 if (!req.headers.get('content-type')?.startsWith('multipart/form-data;')) throw new HttpError(415,'Formato inválido.');
 const bytes = await body(req, 1200000);
 let form: FormData; try { form = await new Response(new Uint8Array(bytes),{headers:{'Content-Type':req.headers.get('content-type')!}}).formData(); } catch { throw new HttpError(400,'Formulário inválido.'); }
 const raw = form.get('metadata'); if (typeof raw !== 'string' || raw.length > 8192) throw new HttpError(400,'Dados inválidos.');
 let parsed; try { parsed = demoSchema.safeParse(JSON.parse(raw)); } catch { throw new HttpError(400,'Dados inválidos.'); }
 if (!parsed.success) throw new HttpError(400,'Dados ou consentimento inválidos.');
 const file = form.get('photo'); if (file && !(file instanceof File)) throw new HttpError(400,'Foto inválida.');
 const key = file instanceof File ? await savePhoto(file) : null;
 const token = randomBytes(32).toString('hex');
 try {
 const { technical, location, ...consent } = parsed.data;
 const record = await db.participation.create({ data:{ ...technical, ...location, consentVersion:consent.consentVersion, consentTimestamp:new Date(consent.consentTimestamp), expiresAt:new Date(Date.now()+86400000), photoStorageKey:key, deletionTokenHash:createHash('sha256').update(token).digest('hex') }, select:{ id:true, expiresAt:true } });
 audit('participation_created'); return NextResponse.json({ ...record, deletionToken:token },{status:201});
 } catch(e) { await removePhoto(key); throw e; }
});
