import type {Metadata, Viewport} from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Nivra — Receitas & Prospecção',
  description: 'Controle financeiro pessoal e CRM de prospecção — local, privado e multi-plataforma.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon.ico', sizes: 'any' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Nivra — Receitas & Prospecção',
    description: 'Controle financeiro pessoal e CRM de prospecção — local, privado e multi-plataforma.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Nivra — Receitas & Prospecção',
    description: 'Controle financeiro pessoal e CRM de prospecção — local, privado e multi-plataforma.',
  },
};

export const viewport: Viewport = {
  themeColor: '#07080C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#07080C] text-[#F0E9FF] antialiased selection:bg-[#9B4DFF]/30 selection:text-[#C69BFF]" suppressHydrationWarning>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
