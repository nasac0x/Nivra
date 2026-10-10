'use client';

import React from 'react';
import { NivraProvider, useNivra } from '@/components/NivraContext';
import { GmpQuotaBanner } from '@/components/GmpQuotaBanner';
import { NivraIntroAnimation } from '@/components/NivraIntroAnimation';
import { HeaderContainer } from '@/components/containers/HeaderContainer';
import { RevenueWorkspace } from '@/components/containers/RevenueWorkspace';
import { ProspectWorkspace } from '@/components/prospect/ProspectWorkspace';
import { ModalsContainer } from '@/components/containers/ModalsContainer';
import { MobileTabBar } from '@/components/containers/MobileTabBar';

const emptySubscribe = () => () => {};

/**
 * AppShell — esqueleto do Nivra.
 * O NivraProvider é o DONO de todo estado/ações; os containers abaixo
 * só consomem via useNivra(). Este arquivo é composição pura.
 */
function Shell() {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { ui, cloud } = useNivra();

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#07080C] text-[#C69BFF]">
        <div className="flex flex-col items-center gap-3 font-mono">
          <div className="w-7 h-7 rounded-full border-2 border-[#9B4DFF] border-t-transparent animate-spin" />
          <span className="text-xs text-[#858593]">
            NIVRA TERMINAL · INICIALIZANDO GLASS...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#07080C] text-[#F0E9FF] selection:bg-[#9B4DFF]/30 selection:text-[#C69BFF] overflow-x-hidden">
      {/* Ambient Atmospheric Lights */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[550px] rounded-full bg-[#9B4DFF]/[0.08] blur-[160px] -z-10" aria-hidden="true" />
      <div className="pointer-events-none fixed top-[45%] -right-40 w-[600px] h-[600px] rounded-full bg-[#7C3AED]/[0.05] blur-[180px] -z-10" aria-hidden="true" />
      <div className="pointer-events-none fixed bottom-10 -left-40 w-[500px] h-[500px] rounded-full bg-[#9B4DFF]/[0.04] blur-[170px] -z-10" aria-hidden="true" />

      <GmpQuotaBanner />

      <NivraIntroAnimation
        forceShow={ui.showIntroAnimation}
        onComplete={() => ui.showIntroAnimation && undefined}
      />

      <HeaderContainer />

      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 relative z-10 pb-20 md:pb-8">
        {ui.activeWorkspace === 'prospect' ? (
          <ProspectWorkspace />
        ) : (
          <RevenueWorkspace />
        )}

        {/* Minimal Swiss Editorial Glass Footer (desktop — no mobile a tab bar já fecha a página) */}
        <footer className="hidden md:flex mt-16 pt-6 border-t border-white/[0.06] items-center justify-between gap-3 text-[10px] font-mono text-[#858593]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9B4DFF] shadow-[0_0_8px_#9B4DFF]" />
            <span className="text-[#F0E9FF] font-semibold">NIVRA RECEITA</span>
            <span>·</span>
            <span>SOFTWARE FINANCEIRO DARK GLASS</span>
          </div>
          <div className="flex items-center gap-3">
            <span>REGISTRO LOCAL</span>
            <span>·</span>
            <span>ZERO TELEMETRIA EM NUVEM</span>
          </div>
        </footer>
      </main>

      <ModalsContainer />

      {/* Tab bar inferior estilo app (mobile only) */}
      <MobileTabBar />

      {/* Cloud status toast */}
      {cloud.msg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#0E1017] border border-emerald-500/30 text-emerald-200 px-4 py-2 rounded-lg shadow-2xl font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          {cloud.msg}
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  return (
    <NivraProvider>
      <Shell />
    </NivraProvider>
  );
}
