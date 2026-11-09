import 'dotenv/config';
import { cleanup } from '../src/lib/records';
import { db } from '../src/lib/db';
try{let count;do{count=await cleanup();}while(count===500);console.info('cleanup_completed');}catch{console.error('cleanup_failed');process.exitCode=1;}finally{await db.$disconnect();}
