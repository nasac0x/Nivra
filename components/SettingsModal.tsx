'use client';

import React, { useState } from 'react';
import { Currency, ExchangeRates, UserSettings } from '@/types/finance';
import { NivraLogo } from '@/components/NivraLogo';
import {

  X,
  Check,
  FolderPlus,
  Trash2,
  AlertOctagon,
  Download,
  Upload,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => boolean;
  onClearAllData: () => void;
  onResetLayout: () => void;
  onReplayIntro?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onExportJSON,
  onImportJSON,
  onClearAllData,
  onResetLayout,
  onReplayIntro,
}) => {

  const [activeTab, setActiveTab] = useState<'currencies' | 'categories' | 'backup' | 'danger'>('currencies');

  const [usdBrl, setUsdBrl] = useState<string>(String(settings.exchangeRates.USD_BRL));
  const [usdEur, setUsdEur] = useState<string>(String(settings.exchangeRates.USD_EUR));
  const [eurBrl, setEurBrl] = useState<string>(String(settings.exchangeRates.EUR_BRL));
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>(settings.defaultCurrency);

  const [categories, setCategories] = useState<string[]>([...settings.categories]);
  const [newCatInput, setNewCatInput] = useState<string>('');

  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    const rateBrl = parseFloat(usdBrl.replace(',', '.')) || 5.40;
    const rateEur = parseFloat(usdEur.replace(',', '.')) || 0.92;
    const rateEurBrl = parseFloat(eurBrl.replace(',', '.')) || (rateBrl / rateEur);

    const updatedRates: ExchangeRates = {
      USD_BRL: Math.max(0.01, rateBrl),
      USD_EUR: Math.max(0.01, rateEur),
      EUR_BRL: Math.max(0.01, rateEurBrl),
      lastUpdated: new Date().toISOString(),
      isManual: true,
    };

    onSaveSettings({
      ...settings,
      defaultCurrency,
      exchangeRates: updatedRates,
    });

    showToast('Taxas de câmbio salvas localmente.');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      showToast('Esta categoria já existe.', 'error');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    setNewCatInput('');
    onSaveSettings({ ...settings, categories: updated });
    showToast(`Categoria "${trimmed}" incluída.`);
  };

  const handleDeleteCategory = (catName: string) => {
    if (categories.length <= 1) {
      showToast('Mantenha pelo menos uma categoria.', 'error');
      return;
    }
    const updated = categories.filter((c) => c !== catName);
    setCategories(updated);
    onSaveSettings({ ...settings, categories: updated });
    showToast(`Categoria "${catName}" removida.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = onImportJSON(content);
        if (success) {
          showToast('Backup JSON restaurado com sucesso.');
        } else {
          showToast('Arquivo JSON inválido ou corrompido.', 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteWipe = () => {
    if (deleteConfirmationText.trim() === 'EXCLUIR') {
      onClearAllData();
      setDeleteConfirmationText('');
      onClose();
    } else {
      showToast('Digite EXCLUIR para confirmar.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono text-xs">
      <div className="w-full max-w-2xl bg-[#0E0F16]/95 border border-white/[0.12] backdrop-blur-2xl rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <NivraLogo variant="horizontal" size="xs" colorVariant="purple" glow={true} />
            <span className="text-[10px] text-[#858593] font-mono border-l border-white/10 pl-2.5">
              CONFIGURAÇÕES DO SISTEMA
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#858593] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center gap-4 px-5 pt-3 border-b border-white/[0.06] bg-[#0D0F15] overflow-x-auto text-[11px]">
          <button
            onClick={() => setActiveTab('currencies')}
            className={`pb-2 transition-colors border-b-2 uppercase ${
              activeTab === 'currencies'
                ? 'border-[#9B4DFF] text-[#F2F0F7] font-semibold'
                : 'border-transparent text-[#858593] hover:text-[#F2F0F7]'
            }`}
          >
            CÂMBIO &amp; MOEDAS
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-2 transition-colors border-b-2 uppercase ${
              activeTab === 'categories'
                ? 'border-[#9B4DFF] text-[#F2F0F7] font-semibold'
                : 'border-transparent text-[#858593] hover:text-[#F2F0F7]'
            }`}
          >
            CATEGORIAS
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2 transition-colors border-b-2 uppercase ${
              activeTab === 'backup'
                ? 'border-[#9B4DFF] text-[#F2F0F7] font-semibold'
                : 'border-transparent text-[#858593] hover:text-[#F2F0F7]'
            }`}
          >
            BACKUP &amp; DADOS
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`pb-2 transition-colors border-b-2 uppercase ${
              activeTab === 'danger'
                ? 'border-[#FF5C73] text-[#FF5C73] font-semibold'
                : 'border-transparent text-[#858593] hover:text-[#FF5C73]'
            }`}
          >
            ZONA DE RISCO
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {toastMessage && (
            <div
              className={`p-2.5 border text-[11px] ${
                toastMessage.type === 'success'
                  ? 'bg-[#25D39A]/10 border-[#25D39A]/30 text-[#25D39A]'
                  : 'bg-[#FF5C73]/10 border-[#FF5C73]/30 text-[#FF5C73]'
              }`}
            >
              {toastMessage.text}
            </div>
          )}

          {/* TAB 1: CURRENCIES */}
          {activeTab === 'currencies' && (
            <form onSubmit={handleSaveRates} className="space-y-4">
              <div>
                <label className="block text-[#858593] text-[10px] uppercase mb-1">
                  MOEDA PADRÃO DO TERMINAL
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value as Currency)}
                  className="w-full sm:w-64 px-3 py-1.5 bg-[#12151D] border border-white/[0.1] text-white focus:outline-none focus:border-[#9B4DFF]"
                >
                  <option value="USD">USD ($) - Dólar Americano</option>
                  <option value="BRL">BRL (R$) - Real Brasileiro</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-3 text-[10px] text-[#858593]">
                  <span>TAXAS DE CONVERSÃO MANUAIS</span>
                  <span>ATUALIZADO: {new Date(settings.exchangeRates.lastUpdated).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#858593] text-[10px] mb-1">
                      USD → BRL (R$)
                    </label>
                    <input
                      type="text"
                      value={usdBrl}
                      onChange={(e) => setUsdBrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#12151D] border border-white/[0.1] text-white focus:outline-none focus:border-[#9B4DFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#858593] text-[10px] mb-1">
                      USD → EUR (€)
                    </label>
                    <input
                      type="text"
                      value={usdEur}
                      onChange={(e) => setUsdEur(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#12151D] border border-white/[0.1] text-white focus:outline-none focus:border-[#9B4DFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#858593] text-[10px] mb-1">
                      EUR → BRL (R$)
                    </label>
                    <input
                      type="text"
                      value={eurBrl}
                      onChange={(e) => setEurBrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#12151D] border border-white/[0.1] text-white focus:outline-none focus:border-[#9B4DFF]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#9B4DFF] hover:bg-[#8738ec] text-white font-semibold"
                >
                  SALVAR TAXAS
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nova categoria..."
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#12151D] border border-white/[0.1] text-white focus:outline-none focus:border-[#9B4DFF]"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#9B4DFF] hover:bg-[#8738ec] text-white font-semibold"
                >
                  INCLUIR
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2 bg-[#12151D] border border-white/[0.06]"
                  >
                    <span className="text-[#F2F0F7]">{cat}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-[#858593] hover:text-[#FF5C73] p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-[#12151D] border border-white/[0.06] space-y-2">
                  <div className="font-semibold text-[#F2F0F7] uppercase text-[11px]">
                    EXPORTAR BACKUP .JSON
                  </div>
                  <p className="text-[10px] text-[#858593]">
                    Gera arquivo com histórico completo e parâmetros para restauração.
                  </p>
                  <button
                    onClick={onExportJSON}
                    className="flex items-center justify-center gap-2 w-full py-1.5 bg-[#0D0F15] hover:bg-white/[0.04] text-[#F2F0F7] border border-white/[0.1] mt-2"
                  >
                    <Download className="w-3 h-3 text-[#9B4DFF]" />
                    <span>BAIXAR ARQUIVO</span>
                  </button>
                </div>

                <div className="p-3 bg-[#12151D] border border-white/[0.06] space-y-2">
                  <div className="font-semibold text-[#F2F0F7] uppercase text-[11px]">
                    RESTAURAR BACKUP .JSON
                  </div>
                  <p className="text-[10px] text-[#858593]">
                    Substitui o estado local com os dados de um arquivo salvo.
                  </p>
                  <label className="flex items-center justify-center gap-2 w-full py-1.5 bg-[#9B4DFF] hover:bg-[#8738ec] text-white cursor-pointer mt-2">
                    <Upload className="w-3 h-3" />
                    <span>CARREGAR .JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-[#12151D] border border-white/[0.06] text-[#858593] text-[10px]">
                <ShieldCheck className="w-4 h-4 text-[#9B4DFF] shrink-0 mt-0.5" />
                <p>
                  ARMAZENAMENTO LOCAL PRIVADO: Todos os registros permanecem salvos unicamente na memória deste navegador (localStorage).
                </p>
              </div>

              {/* Visuals & Intro Animation */}
              <div className="p-3 bg-[#12151D] border border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-semibold text-[#F2F0F7] uppercase text-[11px]">
                    ANIMAÇÃO DE ABERTURA (INTRO)
                  </div>
                  <p className="text-[10px] text-[#858593] mt-0.5">
                    Reproduzir a animação cinematográfica de boas-vindas com a logo NIVRA.
                  </p>
                </div>
                {onReplayIntro && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReplayIntro();
                    }}
                    className="px-3 py-1.5 bg-[#9B4DFF]/20 hover:bg-[#9B4DFF]/30 text-[#C69BFF] border border-[#9B4DFF]/40 text-[11px] rounded transition-colors cursor-pointer"
                  >
                    Reproduzir Abertura
                  </button>
                )}
              </div>
            </div>
          )}


          {/* TAB 4: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#12151D] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#F2F0F7] uppercase text-[11px]">
                    RESTAURAR DISPOSIÇÃO DO DASHBOARD
                  </div>
                  <p className="text-[10px] text-[#858593]">
                    Retorna ordem e larguras originais de todos os módulos.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onResetLayout();
                    showToast('Layout padrão restaurado.');
                  }}
                  className="px-3 py-1 bg-[#0D0F15] hover:bg-white/[0.04] text-white border border-white/[0.1]"
                >
                  RESTAURAR
                </button>
              </div>

              <div className="p-3 bg-[#FF5C73]/10 border border-[#FF5C73]/30 space-y-2">
                <div className="flex items-center gap-2 text-[#FF5C73] font-semibold text-[11px] uppercase">
                  <AlertOctagon className="w-4 h-4" />
                  <span>EXCLUSÃO PERMANENTE DA BASE LOCAL</span>
                </div>
                <p className="text-[10px] text-[#858593]">
                  Para apagar permanentemente todas as transações, metas e taxas deste navegador, digite <strong className="text-[#FF5C73]">EXCLUIR</strong>:
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="EXCLUIR"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="px-2.5 py-1 bg-[#0D0F15] border border-[#FF5C73]/40 text-white font-mono text-xs flex-1 sm:w-44 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleExecuteWipe}
                    disabled={deleteConfirmationText.trim() !== 'EXCLUIR'}
                    className="px-3 py-1 bg-[#FF5C73] hover:bg-[#eb4860] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold"
                  >
                    CONFIRMAR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
