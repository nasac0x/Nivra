'use client';

import React from 'react';
import { Plus, ArrowUpRight, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onOpenAddModal: () => void;
  onLoadDemoData: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenAddModal,
  onLoadDemoData,
}) => {
  return (
    <div className="glass-panel-primary glass-specular glass-corner-sheen rounded-2xl p-8 sm:p-14 my-6 font-mono text-center w-full max-w-2xl mx-auto shadow-2xl">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#C69BFF] bg-[#9B4DFF]/15 border border-[#9B4DFF]/30 px-3 py-1 rounded-full">
          <Sparkles className="w-3 h-3 text-[#9B4DFF]" />
          <span>NIVRA REVENUE · BASE VAZIA</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F0E9FF]">
          Comece registrando seu primeiro faturamento.
        </h2>

        <p className="text-xs text-[#858593] leading-relaxed max-w-md mx-auto">
          O sistema opera em modo 100% privado com armazenamento isolado neste dispositivo. Registre entradas para desbloquear o gráfico interativo, métricas de crescimento e relatórios contábeis.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] hover:brightness-110 text-white font-semibold text-xs rounded shadow-[0_6px_25px_rgba(139,92,246,0.35)] transition-all w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>ADICIONAR FATURAMENTO</span>
          </button>

          <button
            onClick={onLoadDemoData}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#F0E9FF] border border-white/[0.1] text-xs rounded transition-colors w-full sm:w-auto min-h-[44px]"
          >
            <span>CARREGAR DADOS DE EXEMPLO</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#C69BFF]" />
          </button>
        </div>
      </div>
    </div>
  );
};
