import { describe,it,expect,beforeEach,vi } from 'vitest';
import { NextRequest } from 'next/server';
import { sameOrigin,admin,body,HttpError,secureTransport } from '../src/lib/security';
import { signSession,verifySession } from '../src/lib/session';
import { demoSchema,consentVersion } from '../src/lib/validation';
beforeEach(()=>{process.env.APP_ORIGIN='https://example.test';process.env.SESSION_SECRET='test-secret-minimum-thirty-two-characters-long';});
describe('authorization and request boundaries',()=>{
 it('rejects unauthenticated admin access',async()=>{await expect(admin(new NextRequest('https://example.test/api/admin/records'))).rejects.toMatchObject({status:401});});
 it('rejects forged and expired sessions',async()=>{expect(await verifySession('forged')).toBe(false);const {SignJWT}=await import('jose');const expired=await new SignJWT({role:'administrator'}).setProtectedHeader({alg:'HS256'}).setSubject('admin').setIssuer('cyber-awareness').setAudience('cyber-admin').setExpirationTime('0s').sign(new TextEncoder().encode(process.env.SESSION_SECRET));expect(await verifySession(expired)).toBe(false);});
 it('accepts signed administrative sessions',async()=>{const token=await signSession();expect(await verifySession(token)).toBe(true);await expect(admin(new NextRequest('https://example.test/api/admin/records',{headers:{cookie:`cyber_session=${token}`}}))).resolves.toBeUndefined();});
 it('rejects cross-origin mutations',()=>{expect(()=>sameOrigin(new NextRequest('https://example.test/api/demo',{headers:{origin:'https://evil.test'}}))).toThrow(HttpError);expect(()=>sameOrigin(new NextRequest('https://example.test/api/demo',{headers:{origin:'https://example.test'}}))).not.toThrow();});
 it('limits actual streamed bytes, independent of content-length',async()=>{const req=new NextRequest('https://example.test/api/demo',{method:'POST',body:'x'.repeat(100)});await expect(body(req,50)).rejects.toMatchObject({status:413});});
 it('enforces HTTPS in production behind the trusted proxy',()=>{vi.stubEnv('NODE_ENV','production');try{expect(()=>secureTransport(new NextRequest('http://example.test/api/demo'))).toThrow(HttpError);expect(()=>secureTransport(new NextRequest('https://example.test/api/demo',{headers:{'x-forwarded-proto':'https'}}))).not.toThrow();}finally{vi.unstubAllEnvs();}});
 it('requires explicit consent and bounded coordinates',()=>{const valid={consent:true,consentVersion,consentTimestamp:new Date().toISOString(),location:null,technical:{browser:'Firefox',operatingSystem:'Linux',language:'pt-BR',screenResolution:'1920×1080',timezone:'Etc/UTC'}};expect(demoSchema.safeParse(valid).success).toBe(true);expect(demoSchema.safeParse({...valid,consent:false}).success).toBe(false);expect(demoSchema.safeParse({...valid,location:{latitude:91,longitude:0,accuracy:1}}).success).toBe(false);expect(demoSchema.safeParse({...valid,password:'not-accepted'}).success).toBe(false);});
});
