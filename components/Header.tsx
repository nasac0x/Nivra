'use client';

import React, { useState } from 'react';
import { Currency, DatePeriod } from '@/types/finance';
import { NivraLogo } from '@/components/NivraLogo';
import {
  Cloud,
  Plus,
  Download,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Calendar,
  FileSpreadsheet,
  FileText,
  Database,
  ChevronDown,
  X,
  Compass,
} from 'lucide-react';

interface HeaderProps {
  activeWorkspace: 'revenue' | 'prospect';
  onSelectWorkspace: (ws: 'revenue' | 'prospect') => void;
  currentPeriod: DatePeriod;
  onSelectPeriod: (p: DatePeriod) => void;
  customRange: { start: string; end: string };
  onUpdateCustomRange: (range: { start: string; end: string }) => void;
  activeCurrency: Currency;
  onSelectCurrency: (c: Currency) => void;
  onOpenAddModal: () => void;
  onExportCurrentPeriodXLSX: () => void;
  onExportAllXLSX: () => void;
  onExportCurrentPeriodPDF: () => void;
  onExportAllPDF: () => void;
  onExportJSON: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
  onReplayIntro?: () => void;
  /** Nuvem (opcional): null = deslogado; mostra estado da conta Supabase */
  cloudUser?: { email: string } | null;
  cloudConfigured?: boolean;
  cloudSyncing?: boolean;
  onOpenCloud?: () => void;
  onSignOutCloud?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  currentPeriod,
  onSelectPeriod,
  customRange,
  onUpdateCustomRange,
  activeCurrency,
  onSelectCurrency,
  onOpenAddModal,
  onExportCurrentPeriodXLSX,
  onExportAllXLSX,
  onExportCurrentPeriodPDF,
  onExportAllPDF,
  onExportJSON,
  isEditMode,
  onToggleEditMode,
  onOpenSettings,
  onReplayIntro,
  cloudUser,
  cloudConfigured,
  cloudSyncing,
  onOpenCloud,
  onSignOutCloud,
}) => {

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [tempStart, setTempStart] = useState(customRange.start);
  const [tempEnd, setTempEnd] = useState(customRange.end);

  const periods: { id: DatePeriod; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: 'this_month', label: 'Mês Atual' },
    { id: 'last_month', label: 'Mês Anterior' },
    { id: 'this_year', label: 'Ano' },
    { id: 'custom', label: 'Período' },
  ];

  const currencies: Currency[] = ['USD', 'BRL', 'EUR'];

  const handlePeriodChange = (p: DatePeriod) => {
    if (p === 'custom') {
      setShowCustomDateModal(true);
    } else {
      onSelectPeriod(p);
    }
  };

  const handleApplyCustomDate = () => {
    if (tempStart && tempEnd) {
      onUpdateCustomRange({ start: tempStart, end: tempEnd });
      onSelectPeriod('custom');
      setShowCustomDateModal(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#07080C]/85 backdrop-blur-[20px] select-none transition-all">
        {/* Top Bar */}
        <div className="@container mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 max-w-[1720px]">
          
          {/* Brand + Workspace Switcher (desktop — mobile usa a saudação da home) */}
          <div className="env-desktop-only flex items-center gap-3">
            <div
              className="flex items-center cursor-pointer group hover:opacity-95 transition-opacity"
              onClick={onReplayIntro}
              title="NIVRA · Clique para rever animação de abertura"
            >
              <NivraLogo
                variant="horizontal"
                size="sm"
                colorVariant="purple"
                glow={true}
                subtitle={activeWorkspace === 'revenue' ? 'REVENUE' : 'PROSPECT'}
              />
            </div>

            {/* Workspace Toggle Tabs */}

            <div className="env-desktop-only flex items-center bg-white/[0.04] border border-white/[0.08] p-0.5 rounded font-mono text-[11px] ml-3">
              <button
                onClick={() => onSelectWorkspace('revenue')}
                className={`px-2.5 sm:px-3 py-1 transition-all rounded-sm cursor-pointer ${
                  activeWorkspace === 'revenue'
                    ? 'bg-[#9B4DFF]/25 text-[#F0E9FF] border border-[#9B4DFF]/40 font-semibold shadow-[0_0_10px_rgba(155,77,255,0.2)]'
                    : 'text-[#858593] hover:text-[#F0E9FF]'
                }`}
              >
                RECEITAS
              </button>
              <button
                onClick={() => onSelectWorkspace('prospect')}
                className={`px-2.5 sm:px-3 py-1 transition-all rounded-sm cursor-pointer flex items-center gap-1.5 ${
                  activeWorkspace === 'prospect'
                    ? 'bg-[#9B4DFF]/25 text-[#F0E9FF] border border-[#9B4DFF]/40 font-semibold shadow-[0_0_10px_rgba(155,77,255,0.2)]'
                    : 'text-[#858593] hover:text-[#F0E9FF]'
                }`}
              >
                <span>PROSPECÇÃO</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              </button>
            </div>
          </div>

          {/* Period Selector — bandeja única "Período ▾" quando o espaço aperta.
              Container query: a decisão é pelo espaço REAL do header,
              não pela viewport (janela estreita ≠ mobile). */}
          {activeWorkspace === 'revenue' ? (
            <nav className="env-desktop-only flex items-center gap-1 @container" data-period-nav>
              {/* bandeja (janela estreita) */}
              <div className="relative [@container(inline-size>=1200px)]:hidden">
                <button
                  onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg font-mono text-[11px] text-[#A0A0B0] hover:text-[#F0E9FF] hover:bg-white/[0.05] cursor-pointer whitespace-nowrap"
                  title="Selecionar período"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#9B4DFF]" />
                  <span>Período</span>
                  <span className="text-[#9B4DFF] font-semibold">{periods.find((p) => p.id === currentPeriod)?.label}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                </button>
                {showPeriodMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowPeriodMenu(false)} />
                    <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[170px] py-1.5 bg-[#0E1017] border border-white/[0.12] rounded-lg shadow-2xl backdrop-blur-xl">
                      {periods.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { handlePeriodChange(p.id); setShowPeriodMenu(false); }}
                          className={`w-full text-left px-3.5 py-1.5 font-mono text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                            currentPeriod === p.id
                              ? 'bg-[#9B4DFF]/20 text-[#F0E9FF] font-semibold'
                              : 'text-[#A0A0B0] hover:bg-white/[0.05] hover:text-[#F0E9FF]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* nav completa (janela larga) */}
              <div className="hidden [@container(inline-size>=1200px)]:flex items-center p-1 bg-white/[0.03] border border-white/[0.08] rounded-lg font-mono text-xs shadow-inner backdrop-blur-md">
                {periods.map((p) => {
                  const isActive = currentPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePeriodChange(p.id)}
                      className={`px-2.5 py-1 text-[11px] rounded transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-[#9B4DFF]/30 text-[#F0E9FF] border border-[#9B4DFF]/60 font-semibold shadow-[0_0_12px_rgba(155,77,255,0.25)]'
                          : 'text-[#858593] hover:text-[#F0E9FF] hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          ) : (

            <div className="env-desktop-only flex items-center gap-2 font-mono text-xs text-[#858593]">
              <Compass className="w-3.5 h-3.5 text-[#9B4DFF]" />
              <span className="tracking-wider uppercase text-[11px] text-[#A0A0B0]">
                Descoberta no Mapa · Registro Manual no CRM
              </span>
            </div>
          )}

          {/* Right Area: Currency + CTA + Tools */}
          <div className="flex items-center gap-2.5 sm:gap-3 font-mono text-xs">
            
            {/* Desktop Actions for Revenue */}
            {activeWorkspace === 'revenue' && (
              <div className="env-desktop-only flex items-center gap-2.5">
                {/* Export Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-1.5 p-1.5 text-[#858593] hover:text-[#F0E9FF] bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded transition-colors cursor-pointer"
                    title="Exportar (Excel, PDF, JSON)"
                    aria-label="Exportar"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <ChevronDown className="w-2.5 h-2.5 opacity-60 [@container(inline-size<1100px)]:hidden" />
                  </button>

                  {showExportMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-[#0E0F16]/95 border border-white/[0.1] shadow-2xl py-1 z-50 text-xs backdrop-blur-2xl rounded-md divide-y divide-white/[0.06]">
                        <div className="p-1">
                          <div className="px-3 py-1 text-[10px] text-[#858593] uppercase tracking-wider font-semibold">
                            Período Selecionado
                          </div>
                          <button
                            onClick={() => {
                              setShowExportMenu(false);
                              onExportCurrentPeriodXLSX();
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-[#F0E9FF] hover:bg-white/[0.05] transition-colors rounded cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#25D39A]" />
                            <span>Planilha Excel (.xlsx)</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowExportMenu(false);
                              onExportCurrentPeriodPDF();
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-[#F0E9FF] hover:bg-white/[0.05] transition-colors rounded cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#C69BFF]" />
                            <span>Relatório Executivo (.pdf)</span>
                          </button>
                        </div>

                        <div className="p-1">
                          <div className="px-3 py-1 text-[10px] text-[#858593] uppercase tracking-wider font-semibold">
                            Histórico Total
                          </div>
                          <button
                            onClick={() => {
                              setShowExportMenu(false);
                              onExportAllXLSX();
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-[#F0E9FF] hover:bg-white/[0.05] transition-colors rounded cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#25D39A]" />
                            <span>Excel Completo (Todos)</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowExportMenu(false);
                              onExportAllPDF();
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-[#F0E9FF] hover:bg-white/[0.05] transition-colors rounded cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#C69BFF]" />
                            <span>PDF Completo (Todos)</span>
                          </button>
                        </div>

                        <div className="p-1">
                          <button
                            onClick={() => {
                              setShowExportMenu(false);
                              onExportJSON();
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-[#858593] hover:text-white hover:bg-white/[0.05] transition-colors rounded cursor-pointer"
                          >
                            <Database className="w-3.5 h-3.5" />
                            <span>Backup JSON (.json)</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Edit Layout */}
                <button
                  onClick={onToggleEditMode}
                  className={`flex items-center p-1.5 rounded border transition-all cursor-pointer ${
                    isEditMode
                      ? 'bg-[#9B4DFF]/20 border-[#9B4DFF]/50 text-[#C69BFF]'
                      : 'text-[#858593] hover:text-[#F0E9FF] bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                  }`}
                  title="Organizar layout"
                  aria-label="Layout"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Cloud Sync (Supabase) — só aparece se configurado */}
            {cloudConfigured && (
              <button
                onClick={() => {
                  if (cloudUser) {
                    onSignOutCloud?.();
                  } else {
                    onOpenCloud?.();
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded border transition-all ${
                  cloudUser
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#858593] hover:text-[#F0E9FF] hover:bg-white/[0.05]'
                } cursor-pointer`}
                title={
                  cloudUser
                    ? `Sincronizado como ${cloudUser.email}${cloudSyncing ? ' (sincronizando...)' : ''} — clique para deslogar`
                    : 'Ativar sincronização na nuvem (login)'
                }
              >
                <Cloud className={`w-3 h-3 ${cloudSyncing ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline font-mono font-medium">
                  {cloudUser
                    ? cloudUser.email.split('@')[0]
                    : 'Nuvem'}
                </span>
                {cloudUser && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            )}

            {/* Ajustes: engrenagem — desktop only (no mobile são os 3 tracinhos da home) */}
            <button
              onClick={onOpenSettings}
              className="env-desktop-only block p-1.5 text-[#858593] hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded transition-colors cursor-pointer"
              title="Ajustes e Metas"
              aria-label="Ajustes"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
            </button>

            {/* Primary Action Button (desktop only — no mobile é o FAB da tab bar) */}
            {activeWorkspace === 'revenue' && (
              <button
                onClick={onOpenAddModal}
                className="env-desktop-only flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-br from-[#9B4DFF] to-[#7C3AED] hover:brightness-110 text-white text-[11px] font-mono font-semibold tracking-tight rounded border border-white/15 shadow-[0_6px_24px_rgba(155,77,255,0.30)] transition-all active:scale-[0.98] min-h-[34px] cursor-pointer whitespace-nowrap"
                title="Novo lançamento"
              >
                <Plus className="w-3 h-3" />
                <span className="[@container(inline-size<1000px)]:hidden">LANÇAMENTO</span>
              </button>
            )}

          </div>
        </div>

      </header>

      {/* Custom Date Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-panel-primary glass-specular rounded-xl p-6 w-full max-w-sm font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#9B4DFF]" />
                <span className="font-semibold text-[#F0E9FF] text-sm">DEFINIR INTERVALO</span>
              </div>
              <button
                onClick={() => setShowCustomDateModal(false)}
                className="text-[#858593] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-[#858593] mb-1">DATA INICIAL</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded text-[#F0E9FF] focus:outline-none focus:border-[#9B4DFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#858593] mb-1">DATA FINAL</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded text-[#F0E9FF] focus:outline-none focus:border-[#9B4DFF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowCustomDateModal(false)}
                  className="px-3 py-1.5 text-xs text-[#858593] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  className="px-4 py-1.5 bg-[#9B4DFF] hover:bg-[#8B3DFF] text-white font-semibold rounded shadow-md cursor-pointer"
                >
                  Aplicar Período
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
