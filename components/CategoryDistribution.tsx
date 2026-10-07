'use client';

import React from 'react';
import { Currency } from '@/types/finance';
import { CategorySummary } from '@/services/metrics';
import { formatCurrency } from '@/services/currency';

interface CategoryDistributionProps {
  categories: CategorySummary[];
  currency: Currency;
  onOpenManageCategories?: () => void;
}

export const CategoryDistribution: React.FC<CategoryDistributionProps> = ({
  categories,
  currency,
  onOpenManageCategories,
}) => {
  const renderBlockBar = (percentage: number) => {
    const totalBlocks = 20;
    const filledBlocks = Math.round((percentage / 100) * totalBlocks);
    return (
      <div className="flex items-center gap-[2px] font-mono text-[9px] select-none text-[#9B4DFF]">
        {Array.from({ length: totalBlocks }).map((_, i) => (
          <span
            key={i}
            className={`w-[4px] h-[10px] inline-block rounded-[1px] transition-all ${
              i < filledBlocks
                ? 'bg-gradient-to-t from-[#7C3AED] to-[#C084FC] shadow-[0_0_6px_rgba(157,78,255,0.4)]'
                : 'bg-white/[0.04]'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="glass-panel-primary glass-specular glass-corner-sheen rounded-xl p-5 sm:p-6 w-full font-mono text-xs">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[#858593] uppercase tracking-wider text-[11px] font-semibold">
            DISTRIBUIÇÃO POR CATEGORIA
          </span>
          <span className="text-white/20">|</span>
          <span className="text-[10px] text-[#C69BFF]">
            PARTICIPAÇÃO PROPORCIONAL
          </span>
        </div>

        {onOpenManageCategories && (
          <button
            onClick={onOpenManageCategories}
            className="text-[11px] text-[#858593] hover:text-[#C69BFF] transition-colors"
          >
            GERENCIAR
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="py-8 text-center text-[#858593] bg-black/20 rounded p-4">
          Nenhuma categoria com faturamento no período ativo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-2 px-3 rounded bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
            >
              {/* Category Name & Count */}
              <div className="min-w-[120px] truncate">
                <span className="text-[#F0E9FF] font-medium">{cat.category}</span>
                <span className="text-[#858593] text-[10px] ml-2">({cat.count})</span>
              </div>

              {/* Block Meter */}
              <div className="hidden sm:block">
                {renderBlockBar(cat.percentage)}
              </div>

              {/* Values */}
              <div className="text-right whitespace-nowrap">
                <span className="text-[#F0E9FF] font-medium">{formatCurrency(cat.total, currency)}</span>
                <span className="text-[#C69BFF] font-bold text-[11px] ml-2 w-10 inline-block text-right">
                  {cat.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
