'use client';

import React from 'react';
import { Currency } from '@/types/finance';
import { formatCurrency } from '@/services/currency';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface SecondaryMetricsProps {
  avgDaily: number;
  avgTicket: number;
  transactionCount: number;
  bestDay: { date: string; amount: number } | null;
  worstDay: { date: string; amount: number } | null;
  bestDayOfWeek: { dayName: string; total: number } | null;
  monthRevenue: number;
  yearRevenue: number;
  growthPct: number;
  isPositiveGrowth: boolean;
  currency: Currency;
}

export const SecondaryMetrics: React.FC<SecondaryMetricsProps> = ({
  avgDaily,
  avgTicket,
  transactionCount,
  bestDay,
  worstDay,
  bestDayOfWeek,
  monthRevenue,
  yearRevenue,
  growthPct,
  isPositiveGrowth,
  currency,
}) => {
  const metrics = [
    {
      label: 'MÉDIA DIÁRIA',
      value: formatCurrency(avgDaily, currency),
      detail: 'No intervalo',
    },
    {
      label: 'TICKET MÉDIO',
      value: formatCurrency(avgTicket, currency),
      detail: 'Por lançamento',
    },
    {
      label: 'LANÇAMENTOS',
      value: String(transactionCount).padStart(2, '0'),
      detail: 'Total do período',
    },
    {
      label: 'MELHOR DIA',
      value: bestDay ? formatCurrency(bestDay.amount, currency) : '—',
      detail: bestDay ? bestDay.date : 'Nenhum registro',
    },
    {
      label: 'DIA DA SEMANA',
      value: bestDayOfWeek ? bestDayOfWeek.dayName.split('-')[0] : '—',
      detail: bestDayOfWeek ? formatCurrency(bestDayOfWeek.total, currency) : 'Sem dados',
    },
    {
      label: 'MÊS ATUAL',
      value: formatCurrency(monthRevenue, currency),
      detail: 'Acumulado',
    },
    {
      label: 'ANO ATUAL',
      value: formatCurrency(yearRevenue, currency),
      detail: 'Acumulado',
    },
    {
      label: 'VARIAÇÃO',
      value: `${isPositiveGrowth ? '+' : ''}${growthPct}%`,
      detail: isPositiveGrowth ? 'Crescimento' : 'Retração',
      valueColor: isPositiveGrowth ? 'text-[#25D39A]' : 'text-[#FF5C73]',
      hasTrend: true,
      isPositive: isPositiveGrowth,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3 w-full">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="glass-panel-secondary rounded-lg p-3 sm:p-3.5 flex flex-col justify-between group"
        >
          <span className="text-[10px] font-mono tracking-wider uppercase text-[#858593] truncate">
            {m.label}
          </span>
          
          <div className="my-1.5">
            <div className={`font-mono text-sm sm:text-base font-bold tracking-tight truncate font-tabular ${m.valueColor || 'text-[#F0E9FF]'}`}>
              {m.value}
            </div>
          </div>

          <div className="flex items-center justify-between text-[9.5px] font-mono text-[#858593]">
            <span className="truncate">{m.detail}</span>
            {m.hasTrend && (
              m.isPositive ? (
                <ArrowUpRight className="w-3 h-3 text-[#25D39A] shrink-0" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-[#FF5C73] shrink-0" />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
