'use client';

import React, { useState } from 'react';
import { Currency } from '@/types/finance';
import { CURRENCY_SYMBOLS } from '@/services/currency';
import { getLocalTodayString } from '@/services/metrics';
import { CornerDownLeft, Check, Terminal, Calendar, Tag, ArrowRight } from 'lucide-react';

interface QuickAddProps {
  activeCurrency: Currency;
  categories?: string[];
  onQuickAdd: (amount: number, description?: string, category?: string, date?: string) => boolean;
}

export const QuickAdd: React.FC<QuickAddProps> = ({
  activeCurrency,
  categories = ['Website', 'Design', 'Freelance', 'Consultoria', 'Produto', 'Serviço', 'Outros'],
  onQuickAdd,
}) => {
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Outros');
  const [date, setDate] = useState(() => getLocalTodayString());
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAddedInfo, setLastAddedInfo] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  const symbol = CURRENCY_SYMBOLS[activeCurrency];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanStr = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const num = parseFloat(cleanStr);

    if (isNaN(num) || num <= 0) {
      setErrorMsg('Informe um valor numérico positivo.');
      return;
    }

    const success = onQuickAdd(num, description.trim(), category, date || getLocalTodayString());
    if (success) {
      setLastAddedInfo(`${symbol} ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      setValue('');
      setDescription('');
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3200);
    }
  };

  return (
    <div className="glass-panel-primary glass-specular glass-corner-sheen rounded-xl p-4 sm:p-5 w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 font-mono text-[11px]">
        <div className="flex items-center gap-2 text-[#858593]">
          <Terminal className="w-3.5 h-3.5 text-[#9B4DFF]" />
          <span className="uppercase tracking-wider text-[#F0E9FF] font-semibold">
            LANÇAMENTO RÁPIDO CONTÁBIL
          </span>
          <span className="text-white/20">·</span>
          <span>Sincronização imediata no faturamento, gráfico e extrato</span>
        </div>

        {showFeedback && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#25D39A] font-mono bg-[#25D39A]/10 border border-[#25D39A]/30 px-2.5 py-0.5 rounded shadow-[0_0_15px_rgba(37,211,154,0.2)]">
            <Check className="w-3 h-3" />
            <span>REGISTRADO: {lastAddedInfo} ({date})</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 font-mono text-xs">
        {/* Terminal prompt symbol */}
        <div className="hidden lg:flex items-center text-[#9B4DFF] select-none text-sm pr-1">
          &gt;
        </div>

        {/* Amount Input with subtle purple glow */}
        <div className="relative w-full lg:w-44">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#C69BFF] font-mono font-bold select-none">
            {symbol}
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/[0.08] text-[#F0E9FF] placeholder-[#858593]/50 rounded text-xs font-mono font-bold focus:outline-none focus:border-[#9B4DFF] focus:shadow-[0_0_15px_rgba(157,78,255,0.25)] transition-all min-h-[40px] font-tabular"
          />
        </div>

        {/* Description Input */}
        <div className="relative w-full lg:flex-1">
          <input
            type="text"
            placeholder="Descrição (ex: Fechamento Projeto, Consultoria, Licença SaaS...)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 bg-black/40 border border-white/[0.08] text-[#F0E9FF] placeholder-[#858593]/50 rounded text-xs font-mono focus:outline-none focus:border-[#9B4DFF] focus:shadow-[0_0_15px_rgba(157,78,255,0.20)] transition-all min-h-[40px]"
          />
        </div>

        {/* Category Selector */}
        <div className="relative w-full sm:w-auto">
          <div className="relative flex items-center">
            <Tag className="absolute left-2.5 w-3 h-3 text-[#858593] pointer-events-none" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full sm:w-36 pl-7 pr-3 py-2 bg-black/40 border border-white/[0.08] text-[#F0E9FF] rounded text-xs font-mono focus:outline-none focus:border-[#9B4DFF] min-h-[40px] appearance-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-[#0D0F15] text-[#F0E9FF]">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Selector */}
        <div className="relative w-full sm:w-auto">
          <div className="relative flex items-center">
            <Calendar className="absolute left-2.5 w-3 h-3 text-[#858593] pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-36 pl-7 pr-2.5 py-2 bg-black/40 border border-white/[0.08] text-[#F0E9FF] rounded text-xs font-mono focus:outline-none focus:border-[#9B4DFF] min-h-[40px] cursor-pointer"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-br from-[#9B4DFF] to-[#7C3AED] hover:brightness-110 active:scale-[0.98] text-white border border-white/20 text-xs font-mono font-semibold rounded shadow-[0_4px_20px_rgba(155,77,255,0.30)] transition-all whitespace-nowrap min-h-[40px]"
        >
          <span>REGISTRAR</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 text-[9px] text-[#F0E9FF] bg-black/30 px-1 py-0.5 rounded border border-white/10">
            <span>ENTER</span>
            <CornerDownLeft className="w-2.5 h-2.5" />
          </kbd>
        </button>
      </form>

      {errorMsg && (
        <div className="mt-2 text-[10px] font-mono text-[#FF5C73]">
          ! {errorMsg}
        </div>
      )}
    </div>
  );
};
