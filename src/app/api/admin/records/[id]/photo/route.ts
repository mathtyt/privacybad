import { db } from '@/lib/db';
import { readPhoto } from '@/lib/storage';
import { route,admin,HttpError,audit } from '@/lib/security';
import { idSchema } from '@/lib/validation';
export const GET = route(async req => {
 await admin(req); const id=req.nextUrl.pathname.split('/').at(-2); if (!idSchema.safeParse(id).success) throw new HttpError(404,'Foto indisponível.');
 const record=await db.participation.findFirst({where:{id,expiresAt:{gt:new Date()}},select:{photoStorageKey:true}});
 if (!record?.photoStorageKey) throw new HttpError(404,'Foto indisponível.');
 audit('photo_read'); return new Response(new Uint8Array(await readPhoto(record.photoStorageKey)),{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','Content-Disposition':'inline; filename="authorized-photo.jpg"'}});
});
