import { hash } from 'bcryptjs';
import { createInterface } from 'node:readline/promises';
// Read from stdin; never pass a password in process arguments or shell history.
if(process.stdin.isTTY) process.stderr.write('Digite uma senha longa (entrada oculta): ');
const wasRaw=process.stdin.isTTY;
let password='';
if(wasRaw){
 process.stdin.setRawMode(true);process.stdin.resume();
 password=await new Promise<string>((resolve,reject)=>{let value='';process.stdin.on('data',(data:Buffer)=>{for(const ch of data.toString()){if(ch==='\u0003'){reject(new Error('Cancelado'));return;}if(ch==='\r'||ch==='\n'){resolve(value);return;}if(ch==='\u007f')value=value.slice(0,-1);else value+=ch;}});});
 process.stdin.setRawMode(false);process.stdin.pause();process.stderr.write('\n');
}else{const rl=createInterface({input:process.stdin});password=(await rl.question('')).trimEnd();rl.close();}
if(password.length<14)throw new Error('Use pelo menos 14 caracteres.');
console.log(await hash(password,12));
