'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Transaction,
  Currency,
  DatePeriod,
  ChartInterval,
  UserSettings,
  DashboardModuleId,
} from '@/types/finance';
import {
  getStoredTransactions,
  saveStoredTransactions,
  getStoredSettings,
  saveStoredSettings,
  getSampleDemoTransactions,
  exportBackupJSON,
  importBackupJSON,
  resetAllData,
  DEFAULT_MODULES,
} from '@/services/storage';
import { getStoredProspects, saveStoredProspects } from '@/services/prospect-storage';
import { getLocalTodayString } from '@/services/metrics';
import { exportToXLSX } from '@/services/export-xlsx';
import { generatePDF } from '@/services/export-pdf';
import { useRevenueCalculations } from '@/hooks/use-revenue-calculations';
import { useCloudSync } from '@/hooks/use-cloud-sync';
import { useAutoBackup } from '@/hooks/use-auto-backup';

// ============================================================
// TIPOS DO CONTEXTO — o contrato do app inteiro em um lugar
// ============================================================

export type WorkspaceId = 'revenue' | 'prospect';

export interface NivraUIState {
  activeWorkspace: WorkspaceId;
  isEditMode: boolean;
  isAddModalOpen: boolean;
  isSettingsOpen: boolean;
  isAuthModalOpen: boolean;
  editingTransaction: Transaction | null;
  showIntroAnimation: boolean;
  /** Página individual aberta no mobile (null = home) */
  mobilePage: string | null;
}

export interface NivraContextValue {
  // dados
  transactions: Transaction[];
  settings: UserSettings;
  activeCurrency: Currency;
  currentPeriod: DatePeriod;
  customRange: { start: string; end: string };
  chartInterval: ChartInterval;
  prospects: () => import('@/types/prospect').Prospect[];

  // cálculos (derivados)
  calc: ReturnType<typeof useRevenueCalculations>;

  // ações de dados
  updateTransactions: (
    updaterOrList: Transaction[] | ((prev: Transaction[]) => Transaction[])
  ) => void;
  updateSettings: (newSettings: UserSettings) => void;
  setActiveCurrency: (c: Currency) => void;
  saveTransaction: (
    data: Omit<Transaction, 'id' | 'convertedAmount' | 'createdAt'> & { id?: string }
  ) => void;
  quickAdd: (amount: number, description?: string, category?: string, date?: string) => boolean;
  deleteTransaction: (id: string) => void;
  addCategory: (catName: string) => void;
  loadDemoData: () => void;
  clearAllData: () => void;

  // período / gráfico / workspace
  setCurrentPeriod: (p: DatePeriod) => void;
  setCustomRange: (r: { start: string; end: string }) => void;
  setChartInterval: (i: ChartInterval) => void;
  setActiveWorkspace: (w: WorkspaceId) => void;

  // layout dos módulos
  moveModule: (index: number, direction: 'up' | 'down') => void;
  toggleModuleWidth: (id: DashboardModuleId) => void;
  toggleModuleVisibility: (id: DashboardModuleId) => void;
  resetLayout: () => void;
  sortedModules: import('@/types/finance').ModuleConfig[];

  // exportações
  exportCurrentPeriodXLSX: () => void;
  exportAllXLSX: () => void;
  exportCurrentPeriodPDF: () => void;
  exportAllPDF: () => void;
  exportJSON: () => void;
  importJSON: (jsonStr: string) => boolean;

  // UI
  ui: NivraUIState;
  setUI: (patch: Partial<NivraUIState>) => void;
  openAddModal: (tx?: Transaction | null) => void;

  // nuvem
  cloud: {
    user: import('@/services/cloud').CloudUser | null;
    configured: boolean;
    syncing: boolean;
    msg: string | null;
    signOut: () => void;
    openAuth: () => void;
  };

  // auto-backup
  autoBackup: ReturnType<typeof useAutoBackup>;
}

const NivraContext = createContext<NivraContextValue | null>(null);

// ============================================================
// PROVIDER — único dono do estado; containers só consomem
// ============================================================

export function NivraProvider({ children }: { children: React.ReactNode }) {
  // ---------------- dados ----------------
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [settings, setSettings] = useState<UserSettings>(() => getStoredSettings());
  const [activeCurrency, setActiveCurrency] = useState<Currency>(
    () => getStoredSettings().defaultCurrency || 'USD'
  );
  const [currentPeriod, setCurrentPeriod] = useState<DatePeriod>('30d');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>(() => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - 29);
    return { start: getLocalTodayString(past), end: getLocalTodayString(today) };
  });
  const [chartInterval, setChartInterval] = useState<ChartInterval>('30d');
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('revenue');

  // ---------------- UI ----------------
  const [ui, setUIState] = useState<NivraUIState>({
    activeWorkspace: 'revenue',
    isEditMode: false,
    isAddModalOpen: false,
    isSettingsOpen: false,
    isAuthModalOpen: false,
    editingTransaction: null,
    showIntroAnimation: false,
    mobilePage: null,
  });
  const setUI = useCallback((patch: Partial<NivraUIState>) => {
    setUIState((prev) => ({ ...prev, ...patch }));
  }, []);

  // ---------------- nuvem ----------------
  const {
    cloudUser,
    cloudConfigured,
    cloudSyncing,
    cloudMsg,
    signOut,
    pushTransactions: pushTransactionsToCloud,
  } = useCloudSync({
    onTransactionsFromCloud: (txs) => setTransactions(txs),
  });

  // ---------------- auto-backup ----------------
  const autoBackup = useAutoBackup(() => ({
    version: '1.1',
    exportedAt: new Date().toISOString(),
    transactions,
    settings,
    prospects: getStoredProspects(),
  }));

  // ---------------- ações de dados ----------------
  const updateTransactions = useCallback(
    (updaterOrList: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
      setTransactions((prev) => {
        const next = typeof updaterOrList === 'function' ? updaterOrList(prev) : updaterOrList;
        saveStoredTransactions(next);
        pushTransactionsToCloud(next);
        return next;
      });
    },
    [pushTransactionsToCloud]
  );

  const updateSettings = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  }, []);

  // cálculos derivados
  const calc = useRevenueCalculations({
    transactions,
    settings,
    activeCurrency,
    currentPeriod,
    customRange,
    chartInterval,
  });

  const saveTransaction = useCallback(
    (data: Omit<Transaction, 'id' | 'convertedAmount' | 'createdAt'> & { id?: string }) => {
      setTransactions((prev) => {
        let next: Transaction[];
        if (data.id) {
          next = prev.map((t) =>
            t.id === data.id
              ? {
                  ...t,
                  amount: data.amount,
                  currency: data.currency,
                  date: data.date,
                  category: data.category,
                  description: data.description,
                  notes: data.notes,
                }
              : t
          );
        } else {
          const newRecord: Transaction = {
            id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            date: data.date,
            amount: data.amount,
            currency: data.currency,
            convertedAmount: data.amount,
            category: data.category || 'Sem categoria',
            description: data.description || '',
            notes: data.notes || '',
            createdAt: new Date().toISOString(),
          };
          next = [newRecord, ...prev];
        }
        saveStoredTransactions(next);
        pushTransactionsToCloud(next);
        return next;
      });
    },
    [pushTransactionsToCloud]
  );

  const quickAdd = useCallback(
    (amount: number, description?: string, category?: string, date?: string): boolean => {
      const txDate = date || getLocalTodayString();
      const newRecord: Transaction = {
        id: 'tx_q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        date: txDate,
        amount,
        currency: activeCurrency,
        convertedAmount: amount,
        category: category || 'Outros',
        description: description || 'Lançamento rápido',
        notes: '',
        createdAt: new Date().toISOString(),
      };

      updateTransactions((prev) => [newRecord, ...prev]);

      if (txDate < calc.periodInfo.start || txDate > calc.periodInfo.end) {
        setCurrentPeriod('30d');
      }
      return true;
    },
    [activeCurrency, calc.periodInfo, updateTransactions]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      updateTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [updateTransactions]
  );

  const addCategory = useCallback(
    (catName: string) => {
      const trimmed = catName.trim();
      if (!trimmed || settings.categories.includes(trimmed)) return;
      updateSettings({ ...settings, categories: [...settings.categories, trimmed] });
    },
    [settings, updateSettings]
  );

  const loadDemoData = useCallback(() => {
    updateTransactions(getSampleDemoTransactions());
  }, [updateTransactions]);

  const clearAllData = useCallback(() => {
    resetAllData();
    setTransactions([]);
    setSettings(getStoredSettings());
  }, []);

  // ---------------- layout dos módulos ----------------
  const moveModule = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const newModules = [...settings.modules];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newModules.length) return;
      const temp = newModules[index];
      newModules[index] = newModules[targetIndex];
      newModules[targetIndex] = temp;
      newModules.forEach((m, idx) => {
        m.order = idx;
      });
      updateSettings({ ...settings, modules: newModules });
    },
    [settings, updateSettings]
  );

  const toggleModuleWidth = useCallback(
    (id: DashboardModuleId) => {
      const updated = settings.modules.map((m) =>
        m.id === id ? { ...m, width: (m.width === 'half' ? 'full' : 'half') as any } : m
      );
      updateSettings({ ...settings, modules: updated });
    },
    [settings, updateSettings]
  );

  const toggleModuleVisibility = useCallback(
    (id: DashboardModuleId) => {
      const updated = settings.modules.map((m) =>
        m.id === id ? { ...m, visible: !m.visible } : m
      );
      updateSettings({ ...settings, modules: updated });
    },
    [settings, updateSettings]
  );

  const resetLayout = useCallback(() => {
    updateSettings({ ...settings, modules: DEFAULT_MODULES });
  }, [settings, updateSettings]);

  const sortedModules = useMemo(
    () => [...settings.modules].sort((a, b) => a.order - b.order),
    [settings.modules]
  );

  // ---------------- exportações ----------------
  const exportCurrentPeriodXLSX = useCallback(() => {
    exportToXLSX({
      transactions: calc.currentTransactions,
      previousTransactions: calc.previousTransactions,
      targetCurrency: activeCurrency,
      rates: settings.exchangeRates,
      periodLabel: calc.periodInfo.label,
      startDate: calc.periodInfo.start,
      endDate: calc.periodInfo.end,
    });
  }, [calc, activeCurrency, settings.exchangeRates]);

  const exportAllXLSX = useCallback(() => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    exportToXLSX({
      transactions: sorted,
      previousTransactions: [],
      targetCurrency: activeCurrency,
      rates: settings.exchangeRates,
      periodLabel: 'Histórico Completo',
      startDate: sorted[0]?.date || calc.periodInfo.start,
      endDate: sorted[sorted.length - 1]?.date || calc.periodInfo.end,
    });
  }, [transactions, activeCurrency, settings.exchangeRates, calc.periodInfo]);

  const exportCurrentPeriodPDF = useCallback(() => {
    generatePDF({
      transactions: calc.currentTransactions,
      previousTransactions: calc.previousTransactions,
      targetCurrency: activeCurrency,
      rates: settings.exchangeRates,
      periodLabel: calc.periodInfo.label,
      startDate: calc.periodInfo.start,
      endDate: calc.periodInfo.end,
    });
  }, [calc, activeCurrency, settings.exchangeRates]);

  const exportAllPDF = useCallback(() => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    generatePDF({
      transactions: sorted,
      previousTransactions: [],
      targetCurrency: activeCurrency,
      rates: settings.exchangeRates,
      periodLabel: 'Histórico Completo',
      startDate: sorted[0]?.date || calc.periodInfo.start,
      endDate: sorted[sorted.length - 1]?.date || calc.periodInfo.end,
    });
  }, [transactions, activeCurrency, settings.exchangeRates, calc.periodInfo]);

  const exportJSON = useCallback(() => {
    exportBackupJSON(transactions, settings, getStoredProspects());
  }, [transactions, settings]);

  const importJSON = useCallback(
    (jsonStr: string): boolean => {
      const result = importBackupJSON(jsonStr);
      if (result) {
        updateTransactions(result.transactions);
        updateSettings(result.settings);
        setActiveCurrency(result.settings.defaultCurrency || 'USD');
        if (result.prospects && result.prospects.length > 0) {
          saveStoredProspects(result.prospects);
          window.dispatchEvent(new CustomEvent('nivra-prospects-imported'));
        }
        return true;
      }
      return false;
    },
    [updateTransactions, updateSettings]
  );

  // ---------------- helpers de UI ----------------
  const openAddModal = useCallback(
    (tx?: Transaction | null) => {
      setUI({ isAddModalOpen: true, editingTransaction: tx ?? null });
    },
    [setUI]
  );

  const prospects = useCallback(() => getStoredProspects(), []);

  // ---------------- valor do contexto ----------------
  const value: NivraContextValue = useMemo(
    () => ({
      transactions,
      settings,
      activeCurrency,
      currentPeriod,
      customRange,
      chartInterval,
      prospects,
      calc,
      updateTransactions,
      updateSettings,
      setActiveCurrency,
      saveTransaction,
      quickAdd,
      deleteTransaction,
      addCategory,
      loadDemoData,
      clearAllData,
      setCurrentPeriod,
      setCustomRange,
      setChartInterval,
      setActiveWorkspace,
      moveModule,
      toggleModuleWidth,
      toggleModuleVisibility,
      resetLayout,
      sortedModules,
      exportCurrentPeriodXLSX,
      exportAllXLSX,
      exportCurrentPeriodPDF,
      exportAllPDF,
      exportJSON,
      importJSON,
      ui,
      setUI,
      openAddModal,
      cloud: {
        user: cloudUser,
        configured: cloudConfigured,
        syncing: cloudSyncing,
        msg: cloudMsg,
        signOut,
        openAuth: () => setUI({ isAuthModalOpen: true }),
      },
      autoBackup,
    }),
    [
      transactions,
      settings,
      activeCurrency,
      currentPeriod,
      customRange,
      chartInterval,
      prospects,
      calc,
      updateTransactions,
      updateSettings,
      saveTransaction,
      quickAdd,
      deleteTransaction,
      addCategory,
      loadDemoData,
      clearAllData,
      moveModule,
      toggleModuleWidth,
      toggleModuleVisibility,
      resetLayout,
      sortedModules,
      exportCurrentPeriodXLSX,
      exportAllXLSX,
      exportCurrentPeriodPDF,
      exportAllPDF,
      exportJSON,
      importJSON,
      ui,
      setUI,
      openAddModal,
      cloudUser,
      cloudConfigured,
      cloudSyncing,
      cloudMsg,
      signOut,
      autoBackup,
    ]
  );

  return <NivraContext.Provider value={value}>{children}</NivraContext.Provider>;
}

// ============================================================
// HOOK DE ACESSO — falha alto e claro se usado fora do provider
// ============================================================

export function useNivra(): NivraContextValue {
  const ctx = useContext(NivraContext);
  if (!ctx) {
    throw new Error('useNivra() só pode ser usado dentro de <NivraProvider>');
  }
  return ctx;
}
