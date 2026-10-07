'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, Currency, ExchangeRates } from '@/types/finance';
import { formatCurrency, convertCurrency } from '@/services/currency';
import {
  Search,
  Edit2,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
} from 'lucide-react';

interface HistoryTableProps {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  targetCurrency: Currency;
  exchangeRates: ExchangeRates;
  categories: string[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
}

type SortField = 'date' | 'amount' | 'category' | 'description';
type SortOrder = 'asc' | 'desc';

export const HistoryTable: React.FC<HistoryTableProps> = ({
  transactions,
  allTransactions = [],
  targetCurrency,
  exchangeRates,
  categories,
  onEdit,
  onDelete,
  onOpenAddModal,
}) => {
  const [scope, setScope] = useState<'period' | 'all'>('period');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const baseList = scope === 'all' && allTransactions.length > 0 ? allTransactions : transactions;

  const processedTransactions = useMemo(() => {
    return baseList
      .filter((t) => {
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchDesc = t.description?.toLowerCase().includes(q);
          const matchCat = t.category?.toLowerCase().includes(q);
          const matchNotes = t.notes?.toLowerCase().includes(q);
          const matchAmount = String(t.amount).includes(q);
          if (!matchDesc && !matchCat && !matchNotes && !matchAmount) return false;
        }

        if (selectedCategory !== 'all' && t.category !== selectedCategory) {
          return false;
        }

        if (selectedCurrency !== 'all' && t.currency !== selectedCurrency) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'date') {
          diff = a.date.localeCompare(b.date);
        } else if (sortField === 'amount') {
          const valA = convertCurrency(a.amount, a.currency, targetCurrency, exchangeRates);
          const valB = convertCurrency(b.amount, b.currency, targetCurrency, exchangeRates);
          diff = valA - valB;
        } else if (sortField === 'category') {
          diff = (a.category || '').localeCompare(b.category || '');
        } else if (sortField === 'description') {
          diff = (a.description || '').localeCompare(b.description || '');
        }

        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [
    baseList,
    searchTerm,
    selectedCategory,
    selectedCurrency,
    sortField,
    sortOrder,
    targetCurrency,
    exchangeRates,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleConfirmDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="glass-panel-primary glass-specular glass-corner-sheen rounded-xl p-5 sm:p-6 w-full font-mono text-xs">
      {/* Header with Scope Switcher & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[#858593] uppercase tracking-wider text-[11px] font-semibold">
            REGISTRO CONTÁBIL
          </span>
          <span className="text-white/20">|</span>

          {/* Scope Toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-black/40 border border-white/[0.06] rounded text-[10px]">
            <button
              type="button"
              onClick={() => setScope('period')}
              className={`px-2 py-0.5 rounded transition-all ${
                scope === 'period'
                  ? 'bg-[#9B4DFF]/25 border border-[#9B4DFF]/40 text-[#F0E9FF] font-semibold'
                  : 'text-[#858593] hover:text-[#F0E9FF]'
              }`}
            >
              NO PERÍODO ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-2 py-0.5 rounded transition-all ${
                scope === 'all'
                  ? 'bg-[#9B4DFF]/25 border border-[#9B4DFF]/40 text-[#F0E9FF] font-semibold'
                  : 'text-[#858593] hover:text-[#F0E9FF]'
              }`}
            >
              TODOS ({allTransactions.length || transactions.length})
            </button>
          </div>
        </div>

        {/* Filter Tools */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#858593]" />
            <input
              type="text"
              placeholder="Buscar histórico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-44 pl-7 pr-3 py-1.5 bg-black/40 border border-white/[0.08] rounded text-white placeholder-[#858593]/50 focus:outline-none focus:border-[#9B4DFF] text-xs font-mono"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-black/40 border border-white/[0.08] rounded text-[#F0E9FF] focus:outline-none focus:border-[#9B4DFF] text-xs font-mono"
          >
            <option value="all">Todas Categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Currency Filter */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-2.5 py-1.5 bg-black/40 border border-white/[0.08] rounded text-[#F0E9FF] focus:outline-none focus:border-[#9B4DFF] text-xs font-mono"
          >
            <option value="all">Todas Moedas</option>
            <option value="USD">USD</option>
            <option value="BRL">BRL</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded border border-white/[0.06] bg-black/20">
        <table className="w-full text-left font-mono text-xs">
          <thead className="text-[#858593] uppercase tracking-wider text-[10px] select-none border-b border-white/[0.06] bg-white/[0.02]">
            <tr>
              <th
                onClick={() => toggleSort('date')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>DATA</span>
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('description')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>DESCRIÇÃO</span>
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('category')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>CATEGORIA</span>
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-right">ORIGINAL</th>
              <th
                onClick={() => toggleSort('amount')}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>VALOR ({targetCurrency})</span>
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-right w-16">AÇÕES</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.04]">
            {processedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#858593] font-mono">
                  <div>Nenhum registro encontrado para os filtros selecionados.</div>
                  {scope === 'period' && allTransactions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setScope('all')}
                      className="mt-2.5 px-3 py-1 bg-[#9B4DFF]/15 border border-[#9B4DFF]/35 text-[#C69BFF] hover:bg-[#9B4DFF]/25 rounded text-[11px] transition-colors cursor-pointer"
                    >
                      Exibir todos os {allTransactions.length} registros do histórico geral
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              processedTransactions.map((tx) => {
                const converted = convertCurrency(
                  tx.amount,
                  tx.currency,
                  targetCurrency,
                  exchangeRates
                );
                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-[#858593] whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-2.5 px-3 text-[#F0E9FF]">
                      <div className="font-medium truncate max-w-sm">
                        {tx.description || '—'}
                      </div>
                      {tx.notes && (
                        <div className="text-[10px] text-[#858593] truncate max-w-sm mt-0.5">
                          {tx.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#858593] whitespace-nowrap">
                      <span className="text-[#C69BFF]/80">
                        {tx.category || 'Sem categoria'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#858593] whitespace-nowrap">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#F0E9FF] whitespace-nowrap">
                      {formatCurrency(converted, targetCurrency)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100">
                        <button
                          onClick={() => onEdit(tx)}
                          className="text-[#858593] hover:text-[#C69BFF] p-1 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="text-[#858593] hover:text-[#FF5C73] p-1 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Dynamic Responsiveness) */}
      <div className="md:hidden space-y-2.5">
        {processedTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#858593] bg-black/20 rounded p-4">
            Nenhum lançamento no período ativo.
          </div>
        ) : (
          processedTransactions.map((tx) => {
            const converted = convertCurrency(
              tx.amount,
              tx.currency,
              targetCurrency,
              exchangeRates
            );
            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-lg bg-black/30 border border-white/[0.06] space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-[#F0E9FF]">
                      {tx.description || 'Lançamento sem descrição'}
                    </div>
                    <div className="text-[10px] text-[#858593] mt-0.5">
                      {tx.date} · <span className="text-[#C69BFF]">{tx.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#F0E9FF]">
                      {formatCurrency(converted, targetCurrency)}
                    </div>
                    {tx.currency !== targetCurrency && (
                      <div className="text-[10px] text-[#858593]">
                        Orig: {formatCurrency(tx.amount, tx.currency)}
                      </div>
                    )}
                  </div>
                </div>

                {tx.notes && (
                  <p className="text-[10px] text-[#858593] line-clamp-2 bg-black/20 p-1.5 rounded">
                    {tx.notes}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.04]">
                  <button
                    onClick={() => onEdit(tx)}
                    className="flex items-center gap-1 text-[11px] text-[#C69BFF] px-2.5 py-1.5 bg-white/[0.04] rounded min-h-[36px]"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(tx.id)}
                    className="flex items-center gap-1 text-[11px] text-[#FF5C73] px-2.5 py-1.5 bg-[#FF5C73]/10 rounded min-h-[36px]"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm p-5 bg-[#0E0F16]/95 border border-white/[0.1] rounded-xl shadow-2xl space-y-4 font-mono text-xs backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[#FF5C73] font-semibold border-b border-white/[0.06] pb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="uppercase">Confirmar Exclusão</span>
            </div>

            <p className="text-[#858593] leading-relaxed">
              O lançamento será removido do registro contábil local e as métricas serão recalculadas imediatamente.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-[#858593] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deleteConfirmId)}
                className="px-4 py-1.5 bg-[#FF5C73] hover:bg-[#eb4860] text-white font-semibold rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
