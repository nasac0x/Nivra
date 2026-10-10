'use client';

import React from 'react';
import { Home, Plus, Compass, Target, FileText } from 'lucide-react';
import { useNivra } from '@/components/NivraContext';

/**
 * Tab bar inferior (brief: 4-5 destinos, acessível com uma mão).
 * Início · Prospecção · (＋ FAB) · Metas · Relatórios
 */
export function MobileTabBar() {
  const { ui, setUI, openAddModal } = useNivra();

  const tabBtn = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
      active ? 'text-[#C69BFF]' : 'text-[#858593]'
    }`;

  const goHome = () => setUI({ activeWorkspace: 'revenue', mobilePage: null });
  const goProspect = () => setUI({ activeWorkspace: 'prospect' });
  const goMetas = () => setUI({ activeWorkspace: 'revenue', mobilePage: 'metas' });
  const goRelatorios = () => setUI({ activeWorkspace: 'revenue', mobilePage: 'balanco' });

  const isHome = ui.activeWorkspace === 'revenue' && !ui.mobilePage;
  const isProspect = ui.activeWorkspace === 'prospect';
  const isMetas = ui.activeWorkspace === 'revenue' && ui.mobilePage === 'metas';
  const isRelatorios = ui.activeWorkspace === 'revenue' && ui.mobilePage === 'balanco';

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-[70] bg-[#07080C]/97 backdrop-blur-xl border-t border-white/[0.08]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação principal"
    >
      <div className="flex items-end relative h-[62px] max-w-lg mx-auto">
        <button onClick={goHome} className={tabBtn(isHome)} aria-label="Início">
          <Home className="w-[21px] h-[21px]" strokeWidth={isHome ? 2.4 : 1.8} />
          <span className="text-caption font-mono">Início</span>
        </button>

        <button onClick={goProspect} className={tabBtn(isProspect)} aria-label="Prospecção">
          <Compass className="w-[21px] h-[21px]" strokeWidth={isProspect ? 2.4 : 1.8} />
          <span className="text-caption font-mono">Prospecção</span>
        </button>

        {/* FAB central: novo lançamento */}
        <button
          onClick={() => openAddModal(null)}
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-[#9B4DFF] text-white flex items-center justify-center border-4 border-[#07080C] shadow-[0_10px_32px_rgba(155,77,255,0.5)] active:scale-90 transition-transform"
          aria-label="Novo lançamento"
        >
          <Plus className="w-6 h-6" strokeWidth={2.6} />
        </button>

        <button onClick={goMetas} className={tabBtn(isMetas)} aria-label="Metas">
          <Target className="w-[21px] h-[21px]" strokeWidth={isMetas ? 2.4 : 1.8} />
          <span className="text-caption font-mono">Metas</span>
        </button>

        <button onClick={goRelatorios} className={tabBtn(isRelatorios)} aria-label="Relatórios">
          <FileText className="w-[21px] h-[21px]" strokeWidth={isRelatorios ? 2.4 : 1.8} />
          <span className="text-caption font-mono">Relatórios</span>
        </button>
      </div>
    </nav>
  );
}
