import { cookies } from 'next/headers';
import { SESSION_COOKIE,verifySession } from '@/lib/session';
import Dashboard from '@/components/dashboard';
export const dynamic = 'force-dynamic';
export const metadata = { title:'Operações | CYBER AWARENESS', robots:{index:false,follow:false} };
export default async function Page() { const authenticated=await verifySession((await cookies()).get(SESSION_COOKIE)?.value); return <Dashboard initialAuthenticated={authenticated}/>; }
