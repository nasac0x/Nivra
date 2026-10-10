'use client';

import { useMemo } from 'react';
import { Transaction, UserSettings, Currency, DatePeriod, ChartInterval } from '@/types/finance';
import {
  calculateTotalRevenue,
  calculateDailyRevenue,
  calculateAverageRevenue,
  calculateAverageTicket,
  calculateBestDay,
  calculateWorstDay,
  calculateBestDayOfWeek,
  calculateCategoryDistribution,
  calculatePeriodGrowth,
  getDateRangeForPeriod,
  getLocalTodayString,
} from '@/services/metrics';
import { generateInsights } from '@/services/insights';

interface UseRevenueCalculationsArgs {
  transactions: Transaction[];
  settings: UserSettings;
  activeCurrency: Currency;
  currentPeriod: DatePeriod;
  customRange: { start: string; end: string };
  chartInterval: ChartInterval;
}

/**
 * Todo o cálculo do dashboard: período, receitas, comparativos,
 * gráfico, métricas secundárias, categorias e insights.
 * Extraído de app/page.tsx para conter a lógica em um só lugar testável.
 */
export function useRevenueCalculations({
  transactions,
  settings,
  activeCurrency,
  currentPeriod,
  customRange,
  chartInterval,
}: UseRevenueCalculationsArgs) {
  // Período selecionado
  const periodInfo = useMemo(
    () => getDateRangeForPeriod(currentPeriod, customRange),
    [currentPeriod, customRange]
  );

  // Janela do gráfico
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

  // Transações do período atual e do anterior
  const { currentTransactions, previousTransactions } = useMemo(() => {
    const curr: Transaction[] = [];
    const prev: Transaction[] = [];
    transactions.forEach((tx) => {
      if (tx.date >= periodInfo.start && tx.date <= periodInfo.end) curr.push(tx);
      if (tx.date >= periodInfo.prevStart && tx.date <= periodInfo.prevEnd) prev.push(tx);
    });
    return { currentTransactions: curr, previousTransactions: prev };
  }, [transactions, periodInfo]);

  // Receitas totais (período atual vs anterior)
  const currentTotalRevenue = useMemo(
    () =>
      calculateTotalRevenue(currentTransactions, activeCurrency, settings.exchangeRates),
    [currentTransactions, activeCurrency, settings.exchangeRates]
  );

  const previousTotalRevenue = useMemo(
    () =>
      calculateTotalRevenue(previousTransactions, activeCurrency, settings.exchangeRates),
    [previousTransactions, activeCurrency, settings.exchangeRates]
  );

  // Série diária do gráfico
  const chartDailyPoints = useMemo(
    () =>
      calculateDailyRevenue(
        transactions,
        chartDateInfo.start,
        chartDateInfo.end,
        activeCurrency,
        settings.exchangeRates
      ),
    [transactions, chartDateInfo, activeCurrency, settings.exchangeRates]
  );

  // Série diária do período (para melhor/pior dia)
  const periodDailyPoints = useMemo(
    () =>
      calculateDailyRevenue(
        currentTransactions,
        periodInfo.start,
        periodInfo.end,
        activeCurrency,
        settings.exchangeRates
      ),
    [currentTransactions, periodInfo, activeCurrency, settings.exchangeRates]
  );

  // Métricas secundárias
  const avgDaily = useMemo(
    () => calculateAverageRevenue(currentTotalRevenue, periodInfo.daysCount),
    [currentTotalRevenue, periodInfo.daysCount]
  );

  const avgTicket = useMemo(
    () => calculateAverageTicket(currentTotalRevenue, currentTransactions.length),
    [currentTotalRevenue, currentTransactions.length]
  );

  const bestDay = useMemo(() => calculateBestDay(periodDailyPoints), [periodDailyPoints]);
  const worstDay = useMemo(() => calculateWorstDay(periodDailyPoints), [periodDailyPoints]);

  const bestDayOfWeek = useMemo(
    () =>
      calculateBestDayOfWeek(currentTransactions, activeCurrency, settings.exchangeRates),
    [currentTransactions, activeCurrency, settings.exchangeRates]
  );

  const growth = useMemo(
    () => calculatePeriodGrowth(currentTotalRevenue, previousTotalRevenue),
    [currentTotalRevenue, previousTotalRevenue]
  );

  // KPIs de mês/ano/semana correntes
  const { monthRevenue, yearRevenue, weeklyRevenue } = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();

    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    const sundayTime = new Date(
      sunday.toISOString().split('T')[0] + 'T00:00:00'
    ).getTime();

    let mTotal = 0;
    let yTotal = 0;
    let wTotal = 0;

    transactions.forEach((tx) => {
      const d = new Date(tx.date + 'T12:00:00');
      if (d.getFullYear() === yyyy) {
        yTotal += tx.amount;
        if (d.getMonth() === mm) mTotal += tx.amount;
      }
      if (d.getTime() >= sundayTime) wTotal += tx.amount;
    });

    return { monthRevenue: mTotal, yearRevenue: yTotal, weeklyRevenue: wTotal };
  }, [transactions]);

  // Distribuição por categoria
  const categoryDistribution = useMemo(
    () =>
      calculateCategoryDistribution(
        currentTransactions,
        activeCurrency,
        settings.exchangeRates
      ),
    [currentTransactions, activeCurrency, settings.exchangeRates]
  );

  // Insights
  const insights = useMemo(
    () =>
      generateInsights(
        currentTransactions,
        previousTransactions,
        currentTotalRevenue,
        previousTotalRevenue,
        periodInfo.start,
        periodInfo.end,
        activeCurrency,
        settings.exchangeRates
      ),
    [
      currentTransactions,
      previousTransactions,
      currentTotalRevenue,
      previousTotalRevenue,
      periodInfo,
      activeCurrency,
      settings.exchangeRates,
    ]
  );

  return {
    periodInfo,
    chartDateInfo,
    currentTransactions,
    previousTransactions,
    currentTotalRevenue,
    previousTotalRevenue,
    chartDailyPoints,
    periodDailyPoints,
    avgDaily,
    avgTicket,
    bestDay,
    worstDay,
    bestDayOfWeek,
    growth,
    monthRevenue,
    yearRevenue,
    weeklyRevenue,
    categoryDistribution,
    insights,
  };
}
