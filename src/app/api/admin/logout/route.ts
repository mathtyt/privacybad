import { NextResponse } from 'next/server';
import { route,sameOrigin,admin,audit } from '@/lib/security';
import { SESSION_COOKIE } from '@/lib/session';
export const POST = route(async req => { sameOrigin(req); await admin(req); const response=NextResponse.json({ok:true}); response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0}); audit('logout'); return response; });
