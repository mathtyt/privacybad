import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { route,sameOrigin,limited,HttpError,audit } from '@/lib/security';
import { idSchema } from '@/lib/validation';
import { deleteRecord } from '@/lib/records';
export const DELETE = route(async req => {
 sameOrigin(req); await limited('participant-delete',100,60);
 const id = req.nextUrl.pathname.split('/').pop(); if (!idSchema.safeParse(id).success) throw new HttpError(404,'Registro indisponível.');
 const token = req.headers.get('authorization')?.replace(/^Bearer /,'');
 if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new HttpError(403,'Comprovante de exclusão necessário.');
 const record = await db.participation.findFirst({ where:{ id, deletionTokenHash:createHash('sha256').update(token).digest('hex') } });
 if (!record) throw new HttpError(404,'Registro indisponível.');
 await deleteRecord(record.id); audit('participant_deleted'); return NextResponse.json({deleted:true});
});
