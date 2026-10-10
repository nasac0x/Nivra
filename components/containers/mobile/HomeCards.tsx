'use client';

import React from 'react';
import {
  Scale,
  Target,
  Lightbulb,
  PieChart,
  Receipt,
} from 'lucide-react';
import { useNivra } from '@/components/NivraContext';
import { RevenueChart } from '@/components/RevenueChart';
import { formatCurrency } from '@/services/currency';

// ============================================================
// MOBILE HOME — estilo app de banco: saldo, gráfico e atalhos
// ============================================================

export type MobilePageId = 'balanco' | 'metas' | 'insights' | 'categorias' | 'registro';

/** Saldo + gráfico — o "hero" da home mobile. */
export function MobileHomeHero() {
  const { calc, activeCurrency, chartInterval, setChartInterval } = useNivra();

  return (
    <div className="md:hidden space-y-5">
      {/* Saldo do período — grande, estilo Nubank */}
      <div className="px-1">
        <p className="text-[11px] font-mono text-[#858593] uppercase tracking-widest">
          Receita do período
        </p>
        <p className="text-[2.6rem] leading-tight font-bold text-[#F0E9FF] font-mono mt-1">
          {formatCurrency(calc.currentTotalRevenue, activeCurrency)}
        </p>
        <p className="text-xs font-mono mt-1">
          {calc.growth.isPositive ? (
            <span className="text-emerald-400">
              ▲ {calc.growth.percentage.toFixed(1)}% vs período anterior
            </span>
          ) : (
            <span className="text-rose-400">
              ▼ {Math.abs(calc.growth.percentage).toFixed(1)}% vs período anterior
            </span>
          )}
        </p>
      </div>

      {/* Gráfico de evolução diária — os intervalos do gráfico substituem o seletor de período */}
      <div className="-mx-4">
        <RevenueChart
          data={calc.chartDailyPoints}
          currency={activeCurrency}
          activeInterval={chartInterval}
          onChangeInterval={setChartInterval}
          onOpenAddModal={() => undefined}
        />
      </div>
    </div>
  );
}

/** Grade de atalhos (ícones) — cada um abre uma página individual. */
export function MobileShortcuts({ onOpen }: { onOpen: (p: MobilePageId) => void }) {
  const items: { id: MobilePageId; label: string; icon: React.ElementType }[] = [
    { id: 'balanco', label: 'Balanço', icon: Scale },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'categorias', label: 'Categorias', icon: PieChart },
    { id: 'registro', label: 'Registro', icon: Receipt },
  ];

  return (
    <div className="md:hidden grid grid-cols-4 gap-x-3 gap-y-4 pt-2">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onOpen(it.id)}
          className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          aria-label={it.label}
        >
          <span className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#C69BFF]">
            <it.icon className="w-6 h-6" strokeWidth={1.8} />
          </span>
          <span className="text-[10.5px] font-mono text-[#A0A0B0]">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Cabeçalho de página individual mobile (voltar + título). */
export function MobilePageHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="md:hidden sticky top-14 z-30 -mx-4 px-4 py-3 bg-[#07080C]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center gap-3">
      <button
        onClick={onBack}
        className="p-1.5 -ml-1.5 text-[#C69BFF] active:scale-90 transition-transform"
        aria-label="Voltar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h2 className="text-sm font-mono font-semibold text-[#F0E9FF] uppercase tracking-wider">
        {title}
      </h2>
    </div>
  );
}
