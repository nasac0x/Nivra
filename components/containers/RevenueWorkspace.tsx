'use client';

import React from 'react';
import { useNivra } from '@/components/NivraContext';
import { MainRevenue } from '@/components/MainRevenue';
import { RevenueChart } from '@/components/RevenueChart';
import { QuickAdd } from '@/components/QuickAdd';
import { SecondaryMetrics } from '@/components/SecondaryMetrics';
import { GoalsModule } from '@/components/GoalsModule';
import { InsightsModule } from '@/components/InsightsModule';
import { CategoryDistribution } from '@/components/CategoryDistribution';
import { HistoryTable } from '@/components/HistoryTable';
import { EmptyState } from '@/components/EmptyState';
import { EditLayoutToolbar, ModularCardWrapper } from '@/components/EditLayoutToolbar';
import { MobileHome } from '@/components/containers/mobile/MobileHome';
import { MobilePage } from '@/components/containers/mobile/Pages';

/** Workspace de Revenue: toolbar de layout, empty state e o grid modular. */
export function RevenueWorkspace() {
  const {
    transactions,
    settings,
    activeCurrency,
    chartInterval,
    setChartInterval,
    ui,
    setUI,
    calc,
    quickAdd,
    deleteTransaction,
    openAddModal,
    moveModule,
    toggleModuleWidth,
    toggleModuleVisibility,
    resetLayout,
    sortedModules,
    loadDemoData,
    updateSettings,
  } = useNivra();

  // ===== MOBILE: página individual (via contexto) =====
  if (ui.mobilePage) {
    return (
      <MobilePage
        id={ui.mobilePage as 'balanco' | 'metas' | 'insights' | 'categorias' | 'registro'}
        onBack={() => setUI({ mobilePage: null })}
      />
    );
  }

  return (
    <>
      {/* ===== MOBILE: home fintech (brief) ===== */}
      <MobileHome onOpenPage={(p) => setUI({ mobilePage: p })} />

      {/* ===== DESKTOP: grid modular completo (intocado) ===== */}
      <div className="hidden md:block">
      {/* Modular Layout Toolbar when edit mode is active */}
      <EditLayoutToolbar
        isEditMode={ui.isEditMode}
        onToggleEditMode={() => setUI({ isEditMode: false })}
        modules={settings.modules}
        onToggleModuleVisibility={toggleModuleVisibility}
        onResetLayout={resetLayout}
      />

      {/* Empty State Banner if absolutely 0 transactions exist */}
      {transactions.length === 0 && (
        <EmptyState
          onOpenAddModal={() => openAddModal(null)}
          onLoadDemoData={loadDemoData}
        />
      )}

      {/* Modular Grid System with Dynamic Glass Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-12 ${ui.isEditMode ? 'gap-4' : 'gap-5 sm:gap-6'} items-start`}>
        {sortedModules.map((moduleConfig, index) => {
          if (!moduleConfig.visible && !ui.isEditMode) return null;

          const isFirst = index === 0;
          const isLast = index === sortedModules.length - 1;

          let moduleContent: React.ReactNode = null;

          switch (moduleConfig.id) {
            case 'main_revenue':
              moduleContent = (
                <MainRevenue
                  totalRevenue={calc.currentTotalRevenue}
                  previousRevenue={calc.previousTotalRevenue}
                  periodLabel={calc.periodInfo.label}
                  startDate={calc.periodInfo.start}
                  endDate={calc.periodInfo.end}
                  currency={activeCurrency}
                  transactionCount={calc.currentTransactions.length}
                />
              );
              break;

            case 'quick_add':
              moduleContent = (
                <QuickAdd
                  activeCurrency={activeCurrency}
                  categories={settings.categories}
                  onQuickAdd={quickAdd}
                />
              );
              break;

            case 'revenue_chart':
              moduleContent = (
                <RevenueChart
                  data={calc.chartDailyPoints}
                  currency={activeCurrency}
                  activeInterval={chartInterval}
                  onChangeInterval={setChartInterval}
                  onOpenAddModal={() => openAddModal(null)}
                />
              );
              break;

            case 'metrics_summary':
              moduleContent = (
                <SecondaryMetrics
                  avgDaily={calc.avgDaily}
                  avgTicket={calc.avgTicket}
                  transactionCount={calc.currentTransactions.length}
                  bestDay={calc.bestDay}
                  worstDay={calc.worstDay}
                  bestDayOfWeek={calc.bestDayOfWeek}
                  monthRevenue={calc.monthRevenue}
                  yearRevenue={calc.yearRevenue}
                  growthPct={calc.growth.percentage}
                  isPositiveGrowth={calc.growth.isPositive}
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
                  weeklyRevenue={calc.weeklyRevenue}
                  monthlyRevenue={calc.monthRevenue}
                  annualRevenue={calc.yearRevenue}
                />
              );
              break;

            case 'insights':
              moduleContent = <InsightsModule insights={calc.insights} />;
              break;

            case 'category_distribution':
              moduleContent = (
                <CategoryDistribution
                  categories={calc.categoryDistribution}
                  currency={activeCurrency}
                  onOpenManageCategories={() => setUI({ isSettingsOpen: true })}
                />
              );
              break;

            case 'history_table':
              moduleContent = (
                <HistoryTable
                  transactions={calc.currentTransactions}
                  allTransactions={transactions}
                  targetCurrency={activeCurrency}
                  exchangeRates={settings.exchangeRates}
                  categories={settings.categories}
                  onEdit={(tx) => openAddModal(tx)}
                  onDelete={deleteTransaction}
                  onOpenAddModal={() => openAddModal(null)}
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
              isEditMode={ui.isEditMode}
              onMoveUp={() => moveModule(index, 'up')}
              onMoveDown={() => moveModule(index, 'down')}
              onToggleWidth={() => toggleModuleWidth(moduleConfig.id)}
              onToggleVisibility={() => toggleModuleVisibility(moduleConfig.id)}
              isFirst={isFirst}
              isLast={isLast}
            >
              {moduleContent}
            </ModularCardWrapper>
          );
        })}
      </div>
      </div>
    </>
  );
}
