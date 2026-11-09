import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { route,admin,sameOrigin,audit } from '@/lib/security';
import { cleanup,deleteRecord } from '@/lib/records';
export const GET = route(async req => {
 await admin(req); await cleanup();
 const records = await db.participation.findMany({where:{expiresAt:{gt:new Date()}},orderBy:{createdAt:'desc'},take:200,select:{id:true,createdAt:true,expiresAt:true,consentVersion:true,consentTimestamp:true,photoStorageKey:true,latitude:true,longitude:true,accuracy:true,browser:true,operatingSystem:true,language:true,screenResolution:true,timezone:true}});
 const total = await db.participation.count({where:{expiresAt:{gt:new Date()}}});
 audit('records_read'); return NextResponse.json({total,records:records.map(({photoStorageKey,...record})=>({...record,hasPhoto:!!photoStorageKey}))});
});
export const DELETE = route(async req => { sameOrigin(req); await admin(req); const records=await db.participation.findMany({select:{id:true}}); for(const r of records) await deleteRecord(r.id); audit('records_deleted_all'); return NextResponse.json({deleted:records.length}); });
