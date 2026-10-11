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
import { useEnvironment, useIsStandalone } from '@/hooks/use-environment';

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
  const { ui, setUI, cloud } = useNivra();
  const env = useEnvironment();
  const standalone = useIsStandalone();

  // ------------------------------------------------------------
  // RÉGUA DE 60%: --min-app-width = 60% da tela do usuário.
  // Desktop fluido entre 100% e 60% da tela; abaixo disso o layout
  // congela nesta largura e o excesso corta na borda da janela.
  // ------------------------------------------------------------
  React.useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const minW = Math.round(window.screen.availWidth * 0.6);
      root.style.setProperty('--min-app-width', `${minW}px`);
      root.setAttribute('data-env', env);
    };
    apply();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [env]);

  // ------------------------------------------------------------
  // INSTALADO (standalone): tenta manter a janela >= mínimo.
  // Navegadores normalmente bloqueiam resizeTo — o fallback é o
  // congelamento em --min-app-width (CSS, abaixo).
  // ------------------------------------------------------------
  React.useEffect(() => {
    if (!standalone) return;
    let raf = 0;
    const enforce = () => {
      const minW = window.screen.availWidth * 0.6;
      if (window.innerWidth < minW) {
        try { window.resizeTo(Math.max(minW, window.innerWidth), window.innerHeight); } catch { /* bloqueado */ }
      }
    };
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(enforce);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [standalone]);

  const handleIntroComplete = React.useCallback(() => {
    setUI({ showIntroAnimation: false });
  }, [setUI]);

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
    <div
      className="relative min-h-screen bg-[#07080C] text-[#F0E9FF] selection:bg-[#9B4DFF]/30 selection:text-[#C69BFF] overflow-x-hidden"
      style={env === 'desktop' ? { minWidth: 'var(--min-app-width, 920px)' } : undefined}
    >
      {/* Ambient Atmospheric Lights */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[550px] rounded-full bg-[#9B4DFF]/[0.08] blur-[160px] -z-10" aria-hidden="true" />
      <div className="pointer-events-none fixed top-[45%] -right-40 w-[600px] h-[600px] rounded-full bg-[#7C3AED]/[0.05] blur-[180px] -z-10" aria-hidden="true" />
      <div className="pointer-events-none fixed bottom-10 -left-40 w-[500px] h-[500px] rounded-full bg-[#9B4DFF]/[0.04] blur-[170px] -z-10" aria-hidden="true" />

      <GmpQuotaBanner />

      <NivraIntroAnimation
        forceShow={ui.showIntroAnimation}
        onComplete={handleIntroComplete}
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
