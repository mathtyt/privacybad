import {test,expect} from '@playwright/test';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { access,unlink } from 'node:fs/promises';
import path from 'node:path';
const origin=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
test('real PostgreSQL lifecycle: consent, private image, authorized deletion, expiration',async({request})=>{
 test.skip(!process.env.TEST_ADMIN_PASSWORD||!process.env.DATABASE_URL,'Requires isolated PostgreSQL and TEST_ADMIN_PASSWORD.');
 const db=new PrismaClient();const ids:string[]=[];
 try{
 const metadata={consent:true,consentVersion:'2026-11-v1',consentTimestamp:new Date().toISOString(),location:{latitude:-23.55,longitude:-46.63,accuracy:20},technical:{browser:'Chromium',operatingSystem:'Linux',language:'pt-BR',screenResolution:'1440×900',timezone:'America/Sao_Paulo'}};
 const png=await sharp({create:{width:30,height:30,channels:3,background:'#337755'}}).jpeg().toBuffer();
 const submit=()=>request.post('/api/demo',{headers:{origin},multipart:{metadata:JSON.stringify(metadata),photo:{name:'test.jpg',mimeType:'image/jpeg',buffer:png}}});
 const bad=await request.post('/api/demo',{headers:{origin:'https://evil.test'},multipart:{metadata:JSON.stringify(metadata)}});expect(bad.status()).toBe(403);
 const created=await submit();expect(created.status()).toBe(201);const first=await created.json();ids.push(first.id);expect(first.id).toMatch(/^[a-f0-9-]{36}$/);
 const row=await db.participation.findUniqueOrThrow({where:{id:first.id}});expect(row.latitude).toBe(-23.55);const filename=path.resolve(process.env.PRIVATE_STORAGE_PATH||'./private-data',row.photoStorageKey!);await expect(access(filename)).resolves.toBeUndefined();
 expect((await request.get(`/api/admin/records/${first.id}/photo`)).status()).toBe(401);
 expect((await request.delete(`/api/demo/${first.id}`,{headers:{origin,authorization:'Bearer '+'a'.repeat(64)}})).status()).toBe(404);
 const login=await request.post('/api/admin/login',{headers:{origin},data:{username:process.env.ADMIN_USERNAME||'administrador',password:process.env.TEST_ADMIN_PASSWORD}});expect(login.status()).toBe(200);expect(login.headers()['set-cookie']).toContain('HttpOnly');
 const photo=await request.get(`/api/admin/records/${first.id}/photo`);expect(photo.status()).toBe(200);expect(photo.headers()['cache-control']).toContain('no-store');
 const list=await request.get('/api/admin/records');expect(list.status()).toBe(200);expect(JSON.stringify(await list.json())).not.toContain('deletionTokenHash');
 expect((await request.delete(`/api/admin/records/${first.id}`,{headers:{origin}})).status()).toBe(200);expect(await db.participation.findUnique({where:{id:first.id}})).toBeNull();await expect(access(filename)).rejects.toThrow();
 const second=await (await submit()).json();ids.push(second.id);expect((await request.delete(`/api/demo/${second.id}`,{headers:{origin,authorization:`Bearer ${second.deletionToken}`}})).status()).toBe(200);expect(await db.participation.findUnique({where:{id:second.id}})).toBeNull();
 const third=await (await submit()).json();ids.push(third.id);await db.participation.update({where:{id:third.id},data:{expiresAt:new Date(Date.now()-1000)}});expect((await request.get(`/api/admin/records/${third.id}/photo`)).status()).toBe(404);await request.get('/api/admin/records');expect(await db.participation.findUnique({where:{id:third.id}})).toBeNull();
 const fourth=await (await submit()).json();ids.push(fourth.id);expect((await request.delete('/api/admin/records',{headers:{origin}})).status()).toBe(200);expect(await db.participation.count()).toBe(0);
 expect((await request.post('/api/admin/logout',{headers:{origin}})).status()).toBe(200);expect((await request.get('/api/admin/records')).status()).toBe(401);
 }finally{const remaining=await db.participation.findMany({where:{id:{in:ids}},select:{photoStorageKey:true}});for(const row of remaining){if(row.photoStorageKey)await unlink(path.resolve(process.env.PRIVATE_STORAGE_PATH||'./private-data',row.photoStorageKey)).catch(()=>{});}await db.participation.deleteMany({where:{id:{in:ids}}});await db.$disconnect();}
});
