import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { route,sameOrigin,limited,body,HttpError,audit } from '@/lib/security';
import { loginSchema } from '@/lib/validation';
import { signSession,SESSION_COOKIE } from '@/lib/session';
export const POST = route(async req => {
 sameOrigin(req); await limited('admin-login',10,900);
 let value; try { value = loginSchema.safeParse(JSON.parse((await body(req,2048)).toString())); } catch { throw new HttpError(400,'Dados inválidos.'); }
 if (!value.success) throw new HttpError(400,'Dados inválidos.');
 const hash = process.env.ADMIN_PASSWORD_HASH; const username = process.env.ADMIN_USERNAME;
 if (!hash || !username) throw new HttpError(503,'Administrador não configurado.');
 const passwordMatches = await bcrypt.compare(value.data.password, hash);
 if (!passwordMatches || value.data.username !== username) { audit('login_rejected'); throw new HttpError(401,'Credenciais inválidas.'); }
 const response = NextResponse.json({ok:true}); response.cookies.set(SESSION_COOKIE, await signSession(), {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:7200}); audit('login_success'); return response;
});
