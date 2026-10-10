'use client';

import React from 'react';
import { useNivra } from '@/components/NivraContext';
import { SecondaryMetrics } from '@/components/SecondaryMetrics';
import { GoalsModule } from '@/components/GoalsModule';
import { InsightsModule } from '@/components/InsightsModule';
import { CategoryDistribution } from '@/components/CategoryDistribution';
import { HistoryTable } from '@/components/HistoryTable';
import { MobilePageHeader, MobilePageId } from '@/components/containers/mobile/HomeCards';

/**
 * Páginas individuais do mobile: cada feature que no desktop é um card
 * do grid vira uma página dedicada com header (voltar + título).
 */

export function MobilePage({ id, onBack }: { id: string; onBack: () => void }) {
  const {
    calc,
    settings,
    activeCurrency,
    transactions,
    updateSettings,
    deleteTransaction,
    openAddModal,
  } = useNivra();

  switch (id) {
    case 'balanco':
      return (
        <div className="md:hidden">
          <MobilePageHeader title="Balanço" onBack={onBack} />
          <div className="pt-4">
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
          </div>
        </div>
      );

    case 'metas':
      return (
        <div className="md:hidden">
          <MobilePageHeader title="Metas de Receita" onBack={onBack} />
          <div className="pt-4">
            <GoalsModule
              goals={settings.goals}
              onUpdateGoals={(newGoals) => updateSettings({ ...settings, goals: newGoals })}
              currency={activeCurrency}
              weeklyRevenue={calc.weeklyRevenue}
              monthlyRevenue={calc.monthRevenue}
              annualRevenue={calc.yearRevenue}
            />
          </div>
        </div>
      );

    case 'insights':
      return (
        <div className="md:hidden">
          <MobilePageHeader title="Insights" onBack={onBack} />
          <div className="pt-4">
            <InsightsModule insights={calc.insights} />
          </div>
        </div>
      );

    case 'categorias':
      return (
        <div className="md:hidden">
          <MobilePageHeader title="Categorias" onBack={onBack} />
          <div className="pt-4">
            <CategoryDistribution
              categories={calc.categoryDistribution}
              currency={activeCurrency}
              onOpenManageCategories={() => undefined}
            />
          </div>
        </div>
      );

    case 'registro':
      return (
        <div className="md:hidden">
          <MobilePageHeader title="Registro Contábil" onBack={onBack} />
          <div className="pt-4">
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
          </div>
        </div>
      );

    default:
      return null;
  }
}
