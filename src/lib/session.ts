import { SignJWT, jwtVerify } from 'jose';
export const SESSION_COOKIE = 'cyber_session';
function key() {
 const secret = process.env.SESSION_SECRET;
 if (!secret || secret.length < 32) throw new Error('Session configuration missing');
 return new TextEncoder().encode(secret);
}
export async function signSession() {
 return new SignJWT({ role: 'administrator' }).setProtectedHeader({ alg: 'HS256' }).setSubject('admin').setIssuer('cyber-awareness').setAudience('cyber-admin').setIssuedAt().setExpirationTime('2h').sign(key());
}
export async function verifySession(token?: string) {
 if (!token) return false;
 try { const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'], issuer: 'cyber-awareness', audience: 'cyber-admin' }); return payload.sub === 'admin' && payload.role === 'administrator'; } catch { return false; }
}
