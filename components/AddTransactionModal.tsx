'use client';

import React, { useState } from 'react';
import { Transaction, Currency } from '@/types/finance';
import { CURRENCY_SYMBOLS } from '@/services/currency';
import { X, Check } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id' | 'convertedAmount' | 'createdAt'> & { id?: string }) => void;
  initialData?: Transaction | null;
  activeCurrency: Currency;
  categories: string[];
  onAddCategory?: (cat: string) => void;
}

interface FormContentProps {
  initialData?: Transaction | null;
  activeCurrency: Currency;
  categories: string[];
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id' | 'convertedAmount' | 'createdAt'> & { id?: string }) => void;
  onAddCategory?: (cat: string) => void;
}

const TransactionFormContent: React.FC<FormContentProps> = ({
  initialData,
  activeCurrency,
  categories,
  onClose,
  onSave,
  onAddCategory,
}) => {
  const [amount, setAmount] = useState<string>(() => (initialData ? String(initialData.amount) : ''));
  const [currency, setCurrency] = useState<Currency>(() => (initialData ? initialData.currency : activeCurrency));
  const [date, setDate] = useState<string>(() => {
    if (initialData?.date) return initialData.date;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [category, setCategory] = useState<string>(() => initialData?.category || categories[0] || 'Outros');
  const [description, setDescription] = useState<string>(() => initialData?.description || '');
  const [notes, setNotes] = useState<string>(() => initialData?.notes || '');
  const [newCatInput, setNewCatInput] = useState<string>('');
  const [isAddingNewCat, setIsAddingNewCat] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanAmountStr = amount.replace(/[^0-9.,]/g, '').replace(',', '.');
    const numAmount = parseFloat(cleanAmountStr);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Informe um valor de faturamento positivo válido.');
      return;
    }

    if (!date) {
      setErrorMsg('Informe a data do lançamento.');
      return;
    }

    onSave({
      id: initialData?.id,
      amount: numAmount,
      currency,
      date,
      category: category.trim() || 'Sem categoria',
      description: description.trim(),
      notes: notes.trim(),
    });

    onClose();
  };

  const handleCreateNewCategory = () => {
    if (newCatInput.trim()) {
      const trimmed = newCatInput.trim();
      if (onAddCategory) {
        onAddCategory(trimmed);
      }
      setCategory(trimmed);
      setNewCatInput('');
      setIsAddingNewCat(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-[#0E0F16]/95 border border-white/[0.12] backdrop-blur-2xl rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.6)] overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#9B4DFF] rounded-full shadow-[0_0_8px_#9B4DFF]" />
          <span className="font-bold tracking-wider text-[#F0E9FF] uppercase text-[11px]">
            {initialData ? 'EDITAR LANÇAMENTO CONTÁBIL' : 'NOVO LANÇAMENTO DE FATURAMENTO'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-[#858593] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {errorMsg && (
          <div className="p-2.5 bg-[#FF5C73]/10 border border-[#FF5C73]/30 text-[#FF5C73] text-[11px] rounded">
            ! {errorMsg}
          </div>
        )}

        {/* Amount & Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-[#858593] text-[10px] uppercase mb-1">
              VALOR DO FATURAMENTO *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858593] text-sm">
                {CURRENCY_SYMBOLS[currency]}
              </span>
              <input
                autoFocus
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-black/40 border border-white/[0.1] rounded-lg text-base font-bold text-[#F0E9FF] placeholder-[#858593]/40 focus:outline-none focus:border-[#9B4DFF] focus:shadow-[0_0_15px_rgba(157,78,255,0.25)] min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#858593] text-[10px] uppercase mb-1">
              MOEDA
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-full py-2.5 px-2.5 bg-black/40 border border-white/[0.1] rounded-lg text-[#F0E9FF] font-semibold focus:outline-none focus:border-[#9B4DFF] min-h-[44px]"
            >
              <option value="USD">USD ($)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>

        {/* Date & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#858593] text-[10px] uppercase mb-1">
              DATA DO REGISTRO *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/[0.1] rounded text-[#F0E9FF] focus:outline-none focus:border-[#9B4DFF] min-h-[42px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#858593] text-[10px] uppercase">
                CATEGORIA
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                className="text-[9.5px] text-[#C69BFF] hover:underline"
              >
                {isAddingNewCat ? 'SELECIONAR' : '+ NOVA'}
              </button>
            </div>

            {isAddingNewCat ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Nome categoria"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  className="w-full px-2.5 py-2 bg-black/40 border border-white/[0.1] rounded text-[#F0E9FF] focus:outline-none focus:border-[#9B4DFF] min-h-[42px]"
                />
                <button
                  type="button"
                  onClick={handleCreateNewCategory}
                  className="px-3 py-2 bg-[#9B4DFF] hover:bg-[#8738ec] text-white rounded min-h-[42px]"
                >
                  OK
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/[0.1] rounded text-[#F0E9FF] focus:outline-none focus:border-[#9B4DFF] min-h-[42px]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Sem categoria">Sem categoria</option>
              </select>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[#858593] text-[10px] uppercase mb-1">
            DESCRIÇÃO DA OPERAÇÃO
          </label>
          <input
            type="text"
            placeholder="Ex: Landing Page, Consultoria Arquitetura, Venda Produto..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/[0.1] rounded text-[#F0E9FF] placeholder-[#858593]/40 focus:outline-none focus:border-[#9B4DFF] min-h-[42px]"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[#858593] text-[10px] uppercase mb-1">
            OBSERVAÇÕES E NOTAS
          </label>
          <textarea
            rows={2}
            placeholder="Contrato, cliente ou informações complementares..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/[0.1] rounded text-[#F0E9FF] placeholder-[#858593]/40 focus:outline-none focus:border-[#9B4DFF] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#858593] hover:text-white rounded min-h-[44px]"
          >
            CANCELAR
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] hover:brightness-110 text-white font-semibold rounded shadow-[0_6px_25px_rgba(139,92,246,0.3)] min-h-[44px]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>CONFIRMAR LANÇAMENTO</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const AddTransactionModal: React.FC<AddTransactionModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <TransactionFormContent
        key={props.initialData?.id || 'new_transaction'}
        {...props}
      />
    </div>
  );
};
