import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nivra Revenue - Dashboard Financeiro Pessoal',
  description: 'Dashboard financeiro pessoal modular, persistente e privado para controle, análise e exportação de faturamento com suporte multimoeda (USD, BRL, EUR).',
  openGraph: {
    title: 'Nivra Revenue - Dashboard Financeiro Pessoal',
    description: 'Dashboard financeiro pessoal modular, persistente e privado para controle, análise e exportação de faturamento.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nivra Revenue - Dashboard Financeiro Pessoal',
    description: 'Dashboard financeiro pessoal modular, persistente e privado para controle, análise e exportação de faturamento.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#07080C] text-[#F0E9FF] antialiased selection:bg-[#9B4DFF]/30 selection:text-[#C69BFF]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
