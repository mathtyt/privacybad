import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
export async function proxy(req: NextRequest) {
 if(process.env.NODE_ENV==='production' && process.env.APP_ORIGIN?.startsWith('https://') && ['GET','HEAD'].includes(req.method) && !req.nextUrl.pathname.startsWith('/api/') && req.headers.get('x-forwarded-proto')!=='https')return NextResponse.redirect(new URL(req.nextUrl.pathname+req.nextUrl.search,process.env.APP_ORIGIN),308);
 const nonce = btoa(crypto.randomUUID());
 const csp = ["default-src 'self'", `script-src 'self' 'nonce-${nonce}'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''}`, "style-src 'self' 'unsafe-inline'", "img-src 'self' blob: data: https://*.tile.openstreetmap.org", "connect-src 'self'", "font-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'", ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : [])].join('; ');
 const headers = new Headers(req.headers);headers.set('x-nonce',nonce);headers.set('Content-Security-Policy',csp);
 if (req.nextUrl.pathname.startsWith('/api/admin/') && !req.nextUrl.pathname.endsWith('/login') && !await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.json({error:'Autenticação necessária.'},{status:401,headers:{'Cache-Control':'no-store','Content-Security-Policy':csp}});
 const response=NextResponse.next({request:{headers}});response.headers.set('Content-Security-Policy',csp);
 if(req.nextUrl.pathname.startsWith('/gagueio')||req.nextUrl.pathname.startsWith('/api/')) {response.headers.set('Cache-Control','no-store');response.headers.set('X-Robots-Tag','noindex, nofollow');}
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
