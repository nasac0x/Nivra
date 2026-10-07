'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
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
import {
  calculateTotalRevenue,
  calculateDailyRevenue,
  calculateAverageRevenue,
  calculateAverageTicket,
  calculateBestDay,
  calculateWorstDay,
  calculateBestDayOfWeek,
  calculatePeriodGrowth,
  calculateCategoryDistribution,
  getDateRangeForPeriod,
  getLocalTodayString,
} from '@/services/metrics';
import { generateInsights } from '@/services/insights';
import { exportToXLSX } from '@/services/export-xlsx';
import { generatePDF } from '@/services/export-pdf';

import { Header } from '@/components/Header';
import { MainRevenue } from '@/components/MainRevenue';
import { RevenueChart } from '@/components/RevenueChart';
import { QuickAdd } from '@/components/QuickAdd';
import { SecondaryMetrics } from '@/components/SecondaryMetrics';
import { GoalsModule } from '@/components/GoalsModule';
import { InsightsModule } from '@/components/InsightsModule';
import { CategoryDistribution } from '@/components/CategoryDistribution';
import { HistoryTable } from '@/components/HistoryTable';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { SettingsModal } from '@/components/SettingsModal';
import { EditLayoutToolbar, ModularCardWrapper } from '@/components/EditLayoutToolbar';
import { EmptyState } from '@/components/EmptyState';
import { GmpQuotaBanner } from '@/components/GmpQuotaBanner';
import { ProspectWorkspace } from '@/components/prospect/ProspectWorkspace';
import { NivraIntroAnimation } from '@/components/NivraIntroAnimation';

const emptySubscribe = () => () => {};


export default function DashboardPage() {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [, startTransition] = useTransition();

  // Lazy initialize state from localStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return getStoredTransactions();
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    return getStoredSettings();
  });

  const [activeCurrency, setActiveCurrency] = useState<Currency>(() => {
    return getStoredSettings().defaultCurrency || 'USD';
  });

  const [currentPeriod, setCurrentPeriod] = useState<DatePeriod>('30d');

  const [customRange, setCustomRange] = useState<{ start: string; end: string }>(() => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - 29);
    return {
      start: getLocalTodayString(past),
      end: getLocalTodayString(today),
    };
  });

  const [chartInterval, setChartInterval] = useState<ChartInterval>('30d');
  const [activeWorkspace, setActiveWorkspace] = useState<'revenue' | 'prospect'>('revenue');

  // UI state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showIntroAnimation, setShowIntroAnimation] = useState(false);


  // Sync transactions whenever updated (supports functional updates to prevent stale closures)
  const updateTransactions = (
    updaterOrList: Transaction[] | ((prev: Transaction[]) => Transaction[])
  ) => {
    setTransactions((prev) => {
      const next = typeof updaterOrList === 'function' ? updaterOrList(prev) : updaterOrList;
      saveStoredTransactions(next);
      return next;
    });
  };

  // Sync settings whenever updated
  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // Date range calculations
  const periodInfo = useMemo(() => {
    return getDateRangeForPeriod(currentPeriod, customRange);
  }, [currentPeriod, customRange]);

  // Chart range calculations
  const chartDateInfo = useMemo(() => {
    const today = new Date();
    const endStr = getLocalTodayString(today);

    const start = new Date(today);
    if (chartInterval === '7d') start.setDate(start.getDate() - 6);
    else if (chartInterval === '30d') start.setDate(start.getDate() - 29);
    else if (chartInterval === '90d') start.setDate(start.getDate() - 89);
    else if (chartInterval === '6m') start.setMonth(start.getMonth() - 6);
    else if (chartInterval === '1y') start.setFullYear(start.getFullYear() - 1);

    return { start: getLocalTodayString(start), end: endStr };
  }, [chartInterval]);

  // Filter transactions in selected period
  const { currentTransactions, previousTransactions } = useMemo(() => {
    const curr: Transaction[] = [];
    const prev: Transaction[] = [];

    transactions.forEach((tx) => {
      // Direct YYYY-MM-DD string comparisons
      if (tx.date >= periodInfo.start && tx.date <= periodInfo.end) {
        curr.push(tx);
      }
      if (tx.date >= periodInfo.prevStart && tx.date <= periodInfo.prevEnd) {
        prev.push(tx);
      }
    });

    return { currentTransactions: curr, previousTransactions: prev };
  }, [transactions, periodInfo]);

  // Metrics
  const currentTotalRevenue = useMemo(() => {
    return calculateTotalRevenue(currentTransactions, activeCurrency, settings.exchangeRates);
  }, [currentTransactions, activeCurrency, settings.exchangeRates]);

  const previousTotalRevenue = useMemo(() => {
    return calculateTotalRevenue(previousTransactions, activeCurrency, settings.exchangeRates);
  }, [previousTransactions, activeCurrency, settings.exchangeRates]);

  // Chart data
  const chartDailyPoints = useMemo(() => {
    return calculateDailyRevenue(
      transactions,
      chartDateInfo.start,
      chartDateInfo.end,
      activeCurrency,
      settings.exchangeRates
    );
  }, [transactions, chartDateInfo, activeCurrency, settings.exchangeRates]);

  // Secondary metrics
  const periodDailyPoints = useMemo(() => {
    return calculateDailyRevenue(
      currentTransactions,
      periodInfo.start,
      periodInfo.end,
      activeCurrency,
      settings.exchangeRates
    );
  }, [currentTransactions, periodInfo, activeCurrency, settings.exchangeRates]);

  const avgDaily = useMemo(() => {
    return calculateAverageRevenue(currentTotalRevenue, periodInfo.daysCount);
  }, [currentTotalRevenue, periodInfo.daysCount]);

  const avgTicket = useMemo(() => {
    return calculateAverageTicket(currentTotalRevenue, currentTransactions.length);
  }, [currentTotalRevenue, currentTransactions.length]);

  const bestDay = useMemo(() => {
    return calculateBestDay(periodDailyPoints);
  }, [periodDailyPoints]);

  const worstDay = useMemo(() => {
    return calculateWorstDay(periodDailyPoints);
  }, [periodDailyPoints]);

  const bestDayOfWeek = useMemo(() => {
    return calculateBestDayOfWeek(currentTransactions, activeCurrency, settings.exchangeRates);
  }, [currentTransactions, activeCurrency, settings.exchangeRates]);

  const growth = useMemo(() => {
    return calculatePeriodGrowth(currentTotalRevenue, previousTotalRevenue);
  }, [currentTotalRevenue, previousTotalRevenue]);

  // Current calendar month & year revenues for KPI cards
  const { monthRevenue, yearRevenue, weeklyRevenue } = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();

    // Start of week (Sunday)
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    const sundayTime = new Date(sunday.toISOString().split('T')[0] + 'T00:00:00').getTime();

    let mTotal = 0;
    let yTotal = 0;
    let wTotal = 0;

    transactions.forEach((tx) => {
      const d = new Date(tx.date + 'T12:00:00');
      if (d.getFullYear() === yyyy) {
        yTotal += tx.amount;
        if (d.getMonth() === mm) {
          mTotal += tx.amount;
        }
      }
      if (d.getTime() >= sundayTime) {
        wTotal += tx.amount;
      }
    });

    return {
      monthRevenue: mTotal,
      yearRevenue: yTotal,
      weeklyRevenue: wTotal,
    };
  }, [transactions]);

  // Categories
  const categoryDistribution = useMemo(() => {
    return calculateCategoryDistribution(currentTransactions, activeCurrency, settings.exchangeRates);
  }, [currentTransactions, activeCurrency, settings.exchangeRates]);

  // Insights
  const insights = useMemo(() => {
    return generateInsights(
      currentTransactions,
      previousTransactions,
      currentTotalRevenue,
      previousTotalRevenue,
      periodInfo.start,
      periodInfo.end,
      activeCurrency,
      settings.exchangeRates
    );
  }, [
    currentTransactions,
    previousTransactions,
    currentTotalRevenue,
    previousTotalRevenue,
    periodInfo,
    activeCurrency,
    settings.exchangeRates,
  ]);

  // Handler: Save transaction (Add or Edit)
  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'convertedAmount' | 'createdAt'> & { id?: string }
  ) => {
    startTransition(() => {
      if (data.id) {
        // Edit existing
        const updated = transactions.map((t) => {
          if (t.id === data.id) {
            return {
              ...t,
              amount: data.amount,
              currency: data.currency,
              date: data.date,
              category: data.category,
              description: data.description,
              notes: data.notes,
            };
          }
          return t;
        });
        updateTransactions(updated);
      } else {
        // Create new
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
        updateTransactions([newRecord, ...transactions]);
      }
    });
  };

  // Handler: Quick Add (Fast entry with immediate synchronization)
  const handleQuickAdd = (
    amount: number,
    description?: string,
    category?: string,
    date?: string
  ): boolean => {
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

    // If the added date falls outside the currently selected period, switch to 30d so it is immediately visible
    if (txDate < periodInfo.start || txDate > periodInfo.end) {
      setCurrentPeriod('30d');
    }

    return true;
  };

  // Handler: Delete transaction
  const handleDeleteTransaction = (id: string) => {
    updateTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Handler: Open edit modal
  const handleEditClick = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  // Handler: Load sample demo data
  const handleLoadDemoData = () => {
    const sample = getSampleDemoTransactions();
    updateTransactions(sample);
  };

  // Handler: Module reorganization (move up / down)
  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    const newModules = [...settings.modules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newModules.length) return;

    const temp = newModules[index];
    newModules[index] = newModules[targetIndex];
    newModules[targetIndex] = temp;

    // update order numbers
    newModules.forEach((m, idx) => {
      m.order = idx;
    });

    updateSettings({ ...settings, modules: newModules });
  };

  // Handler: Toggle module width (half <-> full)
  const handleToggleModuleWidth = (id: DashboardModuleId) => {
    const updated = settings.modules.map((m) => {
      if (m.id === id) {
        const nextWidth = m.width === 'half' ? 'full' : 'half';
        return { ...m, width: nextWidth as any };
      }
      return m;
    });
    updateSettings({ ...settings, modules: updated });
  };

  // Handler: Toggle module visibility
  const handleToggleModuleVisibility = (id: DashboardModuleId) => {
    const updated = settings.modules.map((m) => {
      if (m.id === id) {
        return { ...m, visible: !m.visible };
      }
      return m;
    });
    updateSettings({ ...settings, modules: updated });
  };

  // Handler: Reset layout
  const handleResetLayout = () => {
    updateSettings({
      ...settings,
      modules: DEFAULT_MODULES,
    });
  };

  // Export Handlers: Selected Period vs All History
  const handleExportCurrentPeriodXLSX = () => {
    exportToXLSX({
      transactions: currentTransactions,
      previousTransactions,
      targetCurrency: activeCurrency,
      rates: settings.exchangeRates,
      periodLabel: periodInfo.label,
      startDate: periodInfo.start,
      endDate: periodInfo.end,
    });
  };

  const handleExportAllXLSX = () => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const earliest = sorted[0]?.date || periodInfo.start;
    const latest = sorted[sorted.length - 1]?.date || periodInfo.end;
    exportToXLSX({
      transactions: sorted,
      previousTransactions: [],
      targetCurrency: activeCurrency,
      rates: settings.exchangeRates,
      periodLabel: 'Histórico Completo',
      startDate: earliest,
      endDate: latest,
    });
  };

  const handleExportCurrentPeriodPDF = () => {
    generatePDF({
      transactions: currentTransactions,
      previousTransactions,
      targetCurrency: activeCurrency,
      rates: settings.exchangeRates,
      periodLabel: periodInfo.label,
      startDate: periodInfo.start,
      endDate: periodInfo.end,
    });
  };

  const handleExportAllPDF = () => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const earliest = sorted[0]?.date || periodInfo.start;
    const latest = sorted[sorted.length - 1]?.date || periodInfo.end;
    generatePDF({
      transactions: sorted,
      previousTransactions: [],
      targetCurrency: activeCurrency,
      rates: settings.exchangeRates,
      periodLabel: 'Histórico Completo',
      startDate: earliest,
      endDate: latest,
    });
  };

  // Handler: Export JSON Backup
  const handleExportJSON = () => {
    exportBackupJSON(transactions, settings);
  };

  // Handler: Import JSON Backup
  const handleImportJSON = (jsonStr: string): boolean => {
    const result = importBackupJSON(jsonStr);
    if (result) {
      updateTransactions(result.transactions);
      updateSettings(result.settings);
      setActiveCurrency(result.settings.defaultCurrency || 'USD');
      return true;
    }
    return false;
  };

  // Handler: Clear all data
  const handleClearAllData = () => {
    resetAllData();
    setTransactions([]);
    setSettings(getStoredSettings());
  };

  // Handler: Add new category
  const handleAddNewCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed || settings.categories.includes(trimmed)) return;
    const newCategories = [...settings.categories, trimmed];
    updateSettings({ ...settings, categories: newCategories });
  };

  // Sort modules for rendering
  const sortedModules = useMemo(() => {
    return [...settings.modules].sort((a, b) => a.order - b.order);
  }, [settings.modules]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#07080C] text-[#C69BFF]">
        <div className="flex flex-col items-center gap-3 font-mono">
          <div className="w-7 h-7 rounded-full border-2 border-[#9B4DFF] border-t-transparent animate-spin" />
          <span className="text-xs text-[#858593]">
            NIVRA TERMINAL · INICIALIZANDO GLASS...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#07080C] text-[#F0E9FF] pb-24 selection:bg-[#9B4DFF]/30 selection:text-[#C69BFF] overflow-x-hidden">
      {/* Ambient Atmospheric Light 1: Primary Upper Purple Diffuse Glow */}
      <div
        className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[550px] rounded-full bg-[#9B4DFF]/[0.08] blur-[160px] -z-10"
        aria-hidden="true"
      />

      {/* Ambient Atmospheric Light 2: Distant Subtle Indigo Glow */}
      <div
        className="pointer-events-none fixed top-[45%] -right-40 w-[600px] h-[600px] rounded-full bg-[#7C3AED]/[0.05] blur-[180px] -z-10"
        aria-hidden="true"
      />

      {/* Ambient Atmospheric Light 3: Bottom Left Faint Aurora */}
      <div
        className="pointer-events-none fixed bottom-10 -left-40 w-[500px] h-[500px] rounded-full bg-[#9B4DFF]/[0.04] blur-[170px] -z-10"
        aria-hidden="true"
      />

      {/* Google Maps Quota Defense Banner */}
      <GmpQuotaBanner />

      {/* Cinematic Opening Intro Animation with Official NIVRA Logo */}
      <NivraIntroAnimation
        forceShow={showIntroAnimation}
        onComplete={() => setShowIntroAnimation(false)}
      />

      {/* Top Glass Header */}
      <Header
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={(ws) => setActiveWorkspace(ws)}
        currentPeriod={currentPeriod}
        onSelectPeriod={(p) => setCurrentPeriod(p)}
        customRange={customRange}
        onUpdateCustomRange={(range) => setCustomRange(range)}
        activeCurrency={activeCurrency}
        onSelectCurrency={(c) => setActiveCurrency(c)}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
        onExportCurrentPeriodXLSX={handleExportCurrentPeriodXLSX}
        onExportAllXLSX={handleExportAllXLSX}
        onExportCurrentPeriodPDF={handleExportCurrentPeriodPDF}
        onExportAllPDF={handleExportAllPDF}
        onExportJSON={handleExportJSON}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReplayIntro={() => setShowIntroAnimation(true)}
      />


      {/* Main Viewport Container */}
      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 relative z-10">
        {activeWorkspace === 'prospect' ? (
          <ProspectWorkspace />
        ) : (
          <>
            {/* Modular Layout Toolbar when edit mode is active */}
            <EditLayoutToolbar
              isEditMode={isEditMode}
              onToggleEditMode={() => setIsEditMode(false)}
              modules={settings.modules}
              onToggleModuleVisibility={handleToggleModuleVisibility}
              onResetLayout={handleResetLayout}
            />

            {/* Empty State Banner if absolutely 0 transactions exist */}
            {transactions.length === 0 && (
              <EmptyState
                onOpenAddModal={() => {
                  setEditingTransaction(null);
                  setIsAddModalOpen(true);
                }}
                onLoadDemoData={handleLoadDemoData}
              />
            )}

        {/* Modular Grid System with Dynamic Glass Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-12 ${isEditMode ? 'gap-4' : 'gap-5 sm:gap-6'} items-start`}>
          {sortedModules.map((moduleConfig, index) => {
            if (!moduleConfig.visible && !isEditMode) return null;

            const isFirst = index === 0;
            const isLast = index === sortedModules.length - 1;

            let moduleContent: React.ReactNode = null;

            switch (moduleConfig.id) {
              case 'main_revenue':
                moduleContent = (
                  <MainRevenue
                    totalRevenue={currentTotalRevenue}
                    previousRevenue={previousTotalRevenue}
                    periodLabel={periodInfo.label}
                    startDate={periodInfo.start}
                    endDate={periodInfo.end}
                    currency={activeCurrency}
                    transactionCount={currentTransactions.length}
                  />
                );
                break;

              case 'quick_add':
                moduleContent = (
                  <QuickAdd
                    activeCurrency={activeCurrency}
                    categories={settings.categories}
                    onQuickAdd={handleQuickAdd}
                  />
                );
                break;

              case 'revenue_chart':
                moduleContent = (
                  <RevenueChart
                    data={chartDailyPoints}
                    currency={activeCurrency}
                    activeInterval={chartInterval}
                    onChangeInterval={(int) => setChartInterval(int)}
                    onOpenAddModal={() => {
                      setEditingTransaction(null);
                      setIsAddModalOpen(true);
                    }}
                  />
                );
                break;

              case 'metrics_summary':
                moduleContent = (
                  <SecondaryMetrics
                    avgDaily={avgDaily}
                    avgTicket={avgTicket}
                    transactionCount={currentTransactions.length}
                    bestDay={bestDay}
                    worstDay={worstDay}
                    bestDayOfWeek={bestDayOfWeek}
                    monthRevenue={monthRevenue}
                    yearRevenue={yearRevenue}
                    growthPct={growth.percentage}
                    isPositiveGrowth={growth.isPositive}
                    currency={activeCurrency}
                  />
                );
                break;

              case 'goals':
                moduleContent = (
                  <GoalsModule
                    goals={settings.goals}
                    onUpdateGoals={(newGoals) =>
                      updateSettings({ ...settings, goals: newGoals })
                    }
                    currency={activeCurrency}
                    weeklyRevenue={weeklyRevenue}
                    monthlyRevenue={monthRevenue}
                    annualRevenue={yearRevenue}
                  />
                );
                break;

              case 'insights':
                moduleContent = <InsightsModule insights={insights} />;
                break;

              case 'category_distribution':
                moduleContent = (
                  <CategoryDistribution
                    categories={categoryDistribution}
                    currency={activeCurrency}
                    onOpenManageCategories={() => setIsSettingsOpen(true)}
                  />
                );
                break;

              case 'history_table':
                moduleContent = (
                  <HistoryTable
                    transactions={currentTransactions}
                    allTransactions={transactions}
                    targetCurrency={activeCurrency}
                    exchangeRates={settings.exchangeRates}
                    categories={settings.categories}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTransaction}
                    onOpenAddModal={() => {
                      setEditingTransaction(null);
                      setIsAddModalOpen(true);
                    }}
                  />
                );
                break;

              default:
                moduleContent = null;
            }

            return (
              <ModularCardWrapper
                key={moduleConfig.id}
                module={moduleConfig}
                isEditMode={isEditMode}
                onMoveUp={() => handleMoveModule(index, 'up')}
                onMoveDown={() => handleMoveModule(index, 'down')}
                onToggleWidth={() => handleToggleModuleWidth(moduleConfig.id)}
                onToggleVisibility={() => handleToggleModuleVisibility(moduleConfig.id)}
                isFirst={isFirst}
                isLast={isLast}
              >
                {moduleContent}
              </ModularCardWrapper>
            );
          })}
        </div>
          </>
        )}

        {/* Minimal Swiss Editorial Glass Footer */}
        <footer className="mt-16 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] font-mono text-[#858593]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9B4DFF] shadow-[0_0_8px_#9B4DFF]" />
            <span className="text-[#F0E9FF] font-semibold">NIVRA REVENUE</span>
            <span>·</span>
            <span>DARK GLASS FINANCIAL SOFTWARE</span>
          </div>
          <div className="flex items-center gap-3">
            <span>LOCAL LEDGER STORAGE</span>
            <span>·</span>
            <span>ZERO CLOUD TELEMETRY</span>
          </div>
        </footer>
      </main>



      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        activeCurrency={activeCurrency}
        categories={settings.categories}
        onAddCategory={handleAddNewCategory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={updateSettings}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onClearAllData={handleClearAllData}
        onResetLayout={handleResetLayout}
        onReplayIntro={() => setShowIntroAnimation(true)}
      />
    </div>
  );
}
