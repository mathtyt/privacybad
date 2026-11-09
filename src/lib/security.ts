import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from './db';
import { SESSION_COOKIE, verifySession } from './session';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function admin(req: NextRequest) {
 if (!await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) throw new HttpError(401, 'Autenticação necessária.');
}
export function sameOrigin(req: NextRequest) {
 const origin = process.env.APP_ORIGIN;
 if (!origin || req.headers.get('origin') !== new URL(origin).origin) throw new HttpError(403, 'Origem não autorizada.');
}
export function secureTransport(req: NextRequest) {
 if (process.env.NODE_ENV === 'production' && (!process.env.APP_ORIGIN?.startsWith('https://') || req.headers.get('x-forwarded-proto') !== 'https')) throw new HttpError(400, 'HTTPS obrigatório.');
}
export async function limited(scope: string, max: number, seconds = 900) {
 // A global database-backed budget intentionally avoids trusting spoofable forwarding headers.
 const key = createHash('sha256').update(scope).digest('hex');
 const rows = await db.$queryRaw<{ count: number }[]>`
 INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, NOW() + ${seconds} * INTERVAL '1 second')
 ON CONFLICT ("key") DO UPDATE SET "count" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
 "resetAt" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN NOW() + ${seconds} * INTERVAL '1 second' ELSE "RateLimit"."resetAt" END RETURNING "count"`;
 if (rows[0].count > max) throw new HttpError(429, 'Limite temporário atingido. Tente mais tarde.');
}
export async function body(req: NextRequest, limit: number) {
 if (Number(req.headers.get('content-length')) > limit) throw new HttpError(413, 'Arquivo muito grande.');
 const reader = req.body?.getReader(); if (!reader) throw new HttpError(400, 'Corpo vazio.');
 const chunks: Uint8Array[] = []; let size = 0;
 while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > limit) { await reader.cancel(); throw new HttpError(413, 'Arquivo muito grande.'); } chunks.push(value); }
 return Buffer.concat(chunks);
}
export function route(fn: (req: NextRequest) => Promise<Response>) {
 return async (req: NextRequest) => { try { secureTransport(req); const response = await fn(req); response.headers.set('Cache-Control','no-store'); return response; } catch(e) {
 const known = e instanceof HttpError;
 // Deliberately omit exception contents, payload, identifiers, images and coordinates.
 if (!known) console.error(JSON.stringify({ event: 'request_failed', route: req.nextUrl.pathname.startsWith('/api/admin') ? 'admin' : 'demo' }));
 return NextResponse.json({ error: known ? e.message : 'Não foi possível concluir a operação.' }, { status: known ? e.status : 500, headers: { 'Cache-Control': 'no-store' } });
 }};
}
export function audit(action: string) { console.info(JSON.stringify({ event: action, at: new Date().toISOString() })); }
