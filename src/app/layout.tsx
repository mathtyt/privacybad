import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'CYBER AWARENESS — Sua privacidade começa com uma escolha', description:'Uma experiência interativa sobre confiança, permissões e privacidade digital.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
