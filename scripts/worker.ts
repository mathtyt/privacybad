import 'dotenv/config';
import { cleanup } from '../src/lib/records';
import { db } from '../src/lib/db';
let stopped=false;process.on('SIGTERM',()=>{stopped=true;});process.on('SIGINT',()=>{stopped=true;});
while(!stopped){try{let count;do{count=await cleanup();}while(count===500);console.info('cleanup_completed');}catch{console.error('cleanup_failed');}
 for(let i=0;i<60&&!stopped;i++)await new Promise(r=>setTimeout(r,1000));}
await db.$disconnect();
