import { z } from 'zod';
export const consentVersion = '2026-11-v1';
export const demoSchema = z.object({
 consentVersion: z.literal(consentVersion), consent: z.literal(true),
 consentTimestamp: z.string().datetime().refine(v => Math.abs(Date.now() - Date.parse(v)) < 10 * 60 * 1000),
 location: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), accuracy: z.number().min(0).max(1000000) }).strict().nullable(),
 technical: z.object({ browser: z.string().min(1).max(80), operatingSystem: z.string().min(1).max(80), language: z.string().min(1).max(40), screenResolution: z.string().regex(/^\d{1,6}×\d{1,6}$/), timezone: z.string().min(1).max(100) }).strict()
}).strict();
export const loginSchema = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(200) }).strict();
export const idSchema = z.string().uuid();
