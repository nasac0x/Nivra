'use client';

import React from 'react';
import { Currency } from '@/types/finance';
import { formatCurrency } from '@/services/currency';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MainRevenueProps {
  totalRevenue: number;
  previousRevenue: number;
  periodLabel: string;
  startDate: string;
  endDate: string;
  currency: Currency;
  transactionCount: number;
}

export const MainRevenue: React.FC<MainRevenueProps> = ({
  totalRevenue,
  previousRevenue,
  periodLabel,
  startDate,
  endDate,
  currency,
  transactionCount,
}) => {
  const diff = totalRevenue - previousRevenue;
  let growthPct = 0;
  let isPositive = true;

  if (previousRevenue <= 0) {
    growthPct = totalRevenue > 0 ? 100 : 0;
    isPositive = true;
  } else {
    growthPct = Math.round(((diff / previousRevenue) * 100) * 10) / 10;
    isPositive = diff >= 0;
  }

  const formattedAmount = formatCurrency(totalRevenue, currency);

  return (
    <section className="glass-panel-primary glass-specular glass-corner-sheen rounded-xl p-5 sm:p-7 md:p-8 w-full transition-all relative overflow-hidden">
      {/* Diffuse purple ambient halo behind the hero revenue slab */}
      <div
        className="pointer-events-none absolute -top-12 left-1/3 w-64 h-32 bg-[#9B4DFF]/15 blur-[60px] rounded-full"
        aria-hidden="true"
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        
        {/* Primary Data Column */}
        <div className="space-y-2">
          {/* Header Title */}
          <div className="flex items-center gap-2.5 text-[11px] font-mono tracking-wider uppercase text-[#858593]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9B4DFF] shadow-[0_0_8px_#9B4DFF]" />
            <span className="text-[#F0E9FF] font-semibold">FATURAMENTO CONSOLIDADO</span>
            <span className="text-white/20">·</span>
            <span className="text-[#C69BFF]">{periodLabel.toUpperCase()}</span>
          </div>

          {/* Number + Growth */}
          <div className="flex flex-wrap items-baseline gap-4 sm:gap-6 pt-1">
            <div
              className="font-mono font-bold tracking-[-0.04em] text-[#F0E9FF] select-all font-tabular"
              style={{
                fontSize: 'clamp(2.4rem, 6.5vw, 4.4rem)',
                lineHeight: '1.05',
                textShadow: '0 0 30px rgba(157, 78, 255, 0.20)',
              }}
            >
              {formattedAmount}
            </div>

            {/* Growth Badge */}
            {previousRevenue === 0 && totalRevenue === 0 ? (
              <div className="flex items-center gap-1 text-xs font-mono text-[#858593] pb-1">
                <Minus className="w-3.5 h-3.5" />
                <span>Base inicial</span>
              </div>
            ) : (
              <div
                className={`flex items-center gap-1 text-sm sm:text-base font-mono font-semibold pb-1.5 ${
                  isPositive ? 'text-[#25D39A]' : 'text-[#FF5C73]'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                )}
                <span>{isPositive ? '+' : ''}{growthPct}%</span>
                <span className="text-[10px] sm:text-[11px] text-[#858593] ml-1 font-normal hidden sm:inline">
                  vs período anterior
                </span>
              </div>
            )}
          </div>

          {/* Clean unboxed metadata */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#858593] pt-1">
            <span>{startDate} → {endDate}</span>
            <span className="text-white/20">·</span>
            <span className="text-[#F0E9FF]">{transactionCount} {transactionCount === 1 ? 'lançamento' : 'lançamentos'}</span>
            <span className="text-white/20">·</span>
            <span>Moeda: {currency}</span>
          </div>
        </div>

        {/* Right Info Details */}
        <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-end gap-1 font-mono text-xs text-[#858593] pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-white/[0.06] md:pl-8">
          <div className="text-[10px] uppercase tracking-wider text-[#858593]">STATUS DO FLUXO</div>
          <div className="text-sm font-semibold text-[#F0E9FF] font-tabular">
            {transactionCount > 0 ? 'Faturamento Ativo' : 'Aguardando Lançamentos'}
          </div>
          <div className="text-[11px] text-[#C69BFF]">
            {periodLabel}
          </div>
        </div>
      </div>
    </section>
  );
};
