'use client';

import React from 'react';
import { InsightItem } from '@/types/finance';

interface InsightsModuleProps {
  insights: InsightItem[];
}

export const InsightsModule: React.FC<InsightsModuleProps> = ({ insights }) => {
  return (
    <div className="glass-panel-primary glass-specular glass-corner-sheen rounded-xl p-5 sm:p-6 w-full font-mono text-xs">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[#858593] uppercase tracking-wider text-[11px] font-semibold">
          DIAGNÓSTICO E INSIGHTS DETERMINÍSTICOS
        </span>
        <span className="text-white/20">|</span>
        <span className="text-[10px] text-[#C69BFF]">
          ESTATÍSTICA MATEMÁTICA PURA
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="p-3.5 rounded-lg bg-black/30 border-l-2 border-[#9B4DFF] border-r border-t border-b border-white/[0.05] hover:border-white/[0.1] transition-all space-y-1"
          >
            <div className="flex items-center gap-2">
              <span className="text-[#9B4DFF] text-[10px]">●</span>
              <span className="font-semibold text-[#F0E9FF] text-xs uppercase tracking-tight">
                {ins.title}
              </span>
            </div>
            <p className="text-[11px] text-[#858593] pl-3 leading-relaxed">
              {ins.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
