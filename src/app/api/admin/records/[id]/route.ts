import { NextResponse } from 'next/server';
import { route,admin,sameOrigin,HttpError,audit } from '@/lib/security';
import { deleteRecord } from '@/lib/records';
import { idSchema } from '@/lib/validation';
export const DELETE = route(async req => { sameOrigin(req); await admin(req); const id=req.nextUrl.pathname.split('/').pop(); if (!idSchema.safeParse(id).success) throw new HttpError(404,'Registro indisponível.'); if (!await deleteRecord(id!)) throw new HttpError(404,'Registro indisponível.'); audit('record_deleted'); return NextResponse.json({deleted:true}); });
