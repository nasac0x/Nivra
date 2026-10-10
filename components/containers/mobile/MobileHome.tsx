'use client';

import React from 'react';
import { Plus, Search, FileText, TrendingUp, ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useNivra } from '@/components/NivraContext';
import { formatCurrency } from '@/services/currency';

/** Bloco de atividade recente (lista estilo fintech). */
function ActivityRow({ desc, amount, date, currency }: { desc: string; amount: number; date: string; currency: any }) {
  const positive = amount >= 0;
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${positive ? 'bg-[#9B4DFF]/12 text-[#C69BFF]' : 'bg-white/[0.04] text-[#858593]'}`}>
        {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#F0E9FF] font-medium truncate">{desc}</p>
        <p className="text-caption text-[#858593] font-mono">{date}</p>
      </div>
      <p className={`text-sm font-semibold font-mono tabular-nums ${positive ? 'text-[#F0E9FF]' : 'text-[#858593]'}`}>
        {formatCurrency(amount, currency)}
      </p>
    </div>
  );
}

/**
 * HOME MOBILE — brief: contexto → métrica → ações rápidas →
 * resumo operacional → atividades recentes. Sem cara de dashboard.
 */
export function MobileHome({ onOpenPage }: { onOpenPage: (p: string) => void }) {
  const { calc, activeCurrency, transactions, openAddModal, ui, setUI } = useNivra();

  const hour = new Date().getHours();
  const saudacao = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  // recentes: 5 últimas transações do período
  const recentes = [...calc.currentTransactions]
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))
    .slice(0, 5);

  return (
    <div className="md:hidden space-y-6">
      {/* ===== Header compacto: saudação + contexto ===== */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-caption text-[#858593] font-mono uppercase tracking-widest">{saudacao},</p>
          <p className="text-h2 text-[#F0E9FF] font-semibold mt-0.5">Aqui está o seu movimento</p>
        </div>
        <button
          onClick={() => setUI({ isSettingsOpen: true })}
          className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#A0A0B0]"
          aria-label="Ajustes"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ===== Métrica principal (o número da tela) ===== */}
      <section className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5">
        <p className="text-caption text-[#858593] font-mono uppercase tracking-wider">Receita · {calc.periodInfo.label}</p>
        <p className="text-display font-bold text-[#F0E9FF] font-mono tabular-nums mt-1.5">
          {formatCurrency(calc.currentTotalRevenue, activeCurrency)}
        </p>
        <p className="text-small mt-1.5 font-mono tabular-nums">
          {calc.growth.isPositive ? (
            <span className="text-emerald-400">▲ {calc.growth.percentage.toFixed(1)}% vs período anterior</span>
          ) : (
            <span className="text-rose-400">▼ {Math.abs(calc.growth.percentage).toFixed(1)}% vs período anterior</span>
          )}
        </p>
      </section>

      {/* ===== Ações rápidas (3, estilo banco) ===== */}
      <section className="grid grid-cols-3 gap-3">
        <button
          onClick={() => openAddModal(null)}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#9B4DFF]/10 border border-[#9B4DFF]/25 py-3.5 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 text-[#C69BFF]" />
          <span className="text-caption text-[#F0E9FF] font-medium">Novo</span>
        </button>
        <button
          onClick={() => onOpenPage('registro')}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] py-3.5 active:scale-95 transition-transform"
        >
          <Search className="w-5 h-5 text-[#A0A0B0]" />
          <span className="text-caption text-[#A0A0B0] font-medium">Buscar</span>
        </button>
        <button
          onClick={() => onOpenPage('balanco')}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] py-3.5 active:scale-95 transition-transform"
        >
          <FileText className="w-5 h-5 text-[#A0A0B0]" />
          <span className="text-caption text-[#A0A0B0] font-medium">Relatório</span>
        </button>
      </section>

      {/* ===== Resumo operacional (4 números discretos) ===== */}
      <section className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onOpenPage('balanco')}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 text-left active:scale-[0.98] transition-transform"
        >
          <p className="text-caption text-[#858593] font-mono uppercase tracking-wider">Média diária</p>
          <p className="text-h3 font-semibold text-[#F0E9FF] font-mono tabular-nums mt-1">
            {formatCurrency(calc.avgDaily, activeCurrency)}
          </p>
        </button>
        <button
          onClick={() => onOpenPage('balanco')}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 text-left active:scale-[0.98] transition-transform"
        >
          <p className="text-caption text-[#858593] font-mono uppercase tracking-wider">Ticket médio</p>
          <p className="text-h3 font-semibold text-[#F0E9FF] font-mono tabular-nums mt-1">
            {formatCurrency(calc.avgTicket, activeCurrency)}
          </p>
        </button>
        <button
          onClick={() => onOpenPage('metas')}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 text-left active:scale-[0.98] transition-transform"
        >
          <p className="text-caption text-[#858593] font-mono uppercase tracking-wider">Mês atual</p>
          <p className="text-h3 font-semibold text-[#F0E9FF] font-mono tabular-nums mt-1">
            {formatCurrency(calc.monthRevenue, activeCurrency)}
          </p>
        </button>
        <button
          onClick={() => onOpenPage('insights')}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 text-left active:scale-[0.98] transition-transform"
        >
          <p className="text-caption text-[#858593] font-mono uppercase tracking-wider">Lançamentos</p>
          <p className="text-h3 font-semibold text-[#F0E9FF] font-mono tabular-nums mt-1">
            {calc.currentTransactions.length}
          </p>
        </button>
      </section>

      {/* ===== Atividades recentes ===== */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-small font-semibold text-[#F0E9FF] font-mono uppercase tracking-wider">Atividades recentes</h3>
          <button
            onClick={() => onOpenPage('registro')}
            className="flex items-center gap-0.5 text-caption text-[#C69BFF] font-mono"
          >
            Ver tudo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] px-4 divide-y divide-white/[0.05]">
          {recentes.length === 0 ? (
            <p className="py-8 text-center text-small text-[#858593]">
              Nenhum lançamento no período.
            </p>
          ) : (
            recentes.map((tx) => (
              <ActivityRow
                key={tx.id}
                desc={tx.description || 'Lançamento'}
                amount={tx.amount}
                date={tx.date}
                currency={activeCurrency}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
