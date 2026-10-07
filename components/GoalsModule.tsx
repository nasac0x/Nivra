'use client';

import React, { useState } from 'react';
import { Currency, FinancialGoals } from '@/types/finance';
import { formatCurrency } from '@/services/currency';
import { calculateGoalProgress } from '@/services/metrics';
import { Target, Check, Edit3 } from 'lucide-react';

interface GoalsModuleProps {
  goals: FinancialGoals;
  onUpdateGoals: (newGoals: FinancialGoals) => void;
  currency: Currency;
  weeklyRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
}

export const GoalsModule: React.FC<GoalsModuleProps> = ({
  goals,
  onUpdateGoals,
  currency,
  weeklyRevenue,
  monthlyRevenue,
  annualRevenue,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [monthlyInput, setMonthlyInput] = useState(String(goals.monthly));
  const [weeklyInput, setWeeklyInput] = useState(String(goals.weekly));
  const [annualInput, setAnnualInput] = useState(String(goals.annual));

  const monthlyProg = calculateGoalProgress(monthlyRevenue, goals.monthly);
  const weeklyProg = calculateGoalProgress(weeklyRevenue, goals.weekly);
  const annualProg = calculateGoalProgress(annualRevenue, goals.annual);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(monthlyInput) || goals.monthly;
    const w = parseFloat(weeklyInput) || goals.weekly;
    const a = parseFloat(annualInput) || goals.annual;
    onUpdateGoals({
      monthly: Math.max(0, m),
      weekly: Math.max(0, w),
      annual: Math.max(0, a),
    });
    setIsEditing(false);
  };

  const renderMeter = (
    label: string,
    prog: ReturnType<typeof calculateGoalProgress>,
    targetValue: number
  ) => {
    return (
      <div className="space-y-1.5 py-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#F0E9FF] font-medium">{label}</span>
            {prog.achieved && (
              <span className="text-[10px] text-[#25D39A] font-mono uppercase bg-[#25D39A]/10 border border-[#25D39A]/30 px-1.5 py-0.5 rounded">
                META ATINGIDA
              </span>
            )}
          </div>
          <div className="font-mono text-[#858593] text-[11px]">
            <span className="text-[#F0E9FF] font-semibold">
              {formatCurrency(prog.current, currency)}
            </span>
            <span className="mx-1.5">/</span>
            <span>{formatCurrency(targetValue, currency)}</span>
            <span className="ml-2 font-bold text-[#C69BFF]">
              ({prog.percentage}%)
            </span>
          </div>
        </div>

        {/* Minimalist Glass Line Track with glow */}
        <div className="w-full h-1.5 bg-black/40 border border-white/[0.05] rounded-full relative overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              prog.achieved
                ? 'bg-gradient-to-r from-[#25D39A] to-[#34d399] shadow-[0_0_8px_#25D39A]'
                : 'bg-gradient-to-r from-[#7C3AED] to-[#C084FC] shadow-[0_0_8px_rgba(157,78,255,0.4)]'
            }`}
            style={{ width: `${Math.min(100, prog.percentage)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel-primary glass-specular glass-corner-sheen rounded-xl p-5 sm:p-6 w-full font-mono text-xs">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[#858593] uppercase tracking-wider text-[11px] font-semibold">
            METAS DE RECEITA
          </span>
          <span className="text-white/20">|</span>
          <span className="text-[10px] text-[#C69BFF]">
            ACOMPANHAMENTO DINÂMICO
          </span>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-[11px] text-[#858593] hover:text-[#C69BFF] transition-colors flex items-center gap-1"
        >
          <Edit3 className="w-3 h-3" />
          <span>{isEditing ? 'FECHAR' : 'AJUSTAR'}</span>
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[#858593] text-[10px] uppercase mb-1">
              Semanal ({currency})
            </label>
            <input
              type="number"
              value={weeklyInput}
              onChange={(e) => setWeeklyInput(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-black/40 border border-white/[0.1] rounded text-white font-mono text-xs focus:outline-none focus:border-[#9B4DFF]"
            />
          </div>
          <div>
            <label className="block text-[#858593] text-[10px] uppercase mb-1">
              Mensal ({currency})
            </label>
            <input
              type="number"
              value={monthlyInput}
              onChange={(e) => setMonthlyInput(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-black/40 border border-white/[0.1] rounded text-white font-mono text-xs focus:outline-none focus:border-[#9B4DFF]"
            />
          </div>
          <div>
            <label className="block text-[#858593] text-[10px] uppercase mb-1">
              Anual ({currency})
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={annualInput}
                onChange={(e) => setAnnualInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-black/40 border border-white/[0.1] rounded text-white font-mono text-xs focus:outline-none focus:border-[#9B4DFF]"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#9B4DFF] hover:bg-[#8738ec] text-white font-semibold text-xs rounded whitespace-nowrap"
              >
                SALVAR
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {renderMeter('META SEMANAL', weeklyProg, goals.weekly)}
          {renderMeter('META MENSAL', monthlyProg, goals.monthly)}
          {renderMeter('META ANUAL', annualProg, goals.annual)}
        </div>
      )}
    </div>
  );
};
