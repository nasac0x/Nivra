import { Transaction, Currency, ExchangeRates, InsightItem } from '@/types/finance';
import { formatCurrency } from './currency';
import {
  calculateDailyRevenue,
  calculateBestDayOfWeek,
  calculateCategoryDistribution,
  calculatePeriodGrowth,
  calculateAverageTicket,
} from './metrics';

export function generateInsights(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[],
  currentRevenue: number,
  previousRevenue: number,
  startDate: string,
  endDate: string,
  targetCurrency: Currency,
  rates: ExchangeRates
): InsightItem[] {
  const insights: InsightItem[] = [];

  if (currentTransactions.length === 0) {
    return [
      {
        id: 'no-data',
        title: 'Nenhum dado registrado no período',
        description: 'Registre lançamentos financeiros para gerar análises e insights automáticos baseados nos seus dados reais.',
        type: 'neutral',
      },
    ];
  }

  // 1. Growth comparison vs previous period
  if (previousTransactions.length > 0 || previousRevenue > 0) {
    const growth = calculatePeriodGrowth(currentRevenue, previousRevenue);
    if (growth.percentage > 0) {
      insights.push({
        id: 'growth-positive',
        title: `Crescimento de +${growth.percentage}%`,
        description: `Seu faturamento aumentou ${growth.percentage}% em relação ao período anterior equivalente (+${formatCurrency(growth.diff, targetCurrency)}).`,
        type: 'positive',
      });
    } else if (growth.percentage < 0) {
      insights.push({
        id: 'growth-negative',
        title: `Retração de ${growth.percentage}%`,
        description: `O faturamento do período atual está ${Math.abs(growth.percentage)}% abaixo do ciclo anterior (-${formatCurrency(Math.abs(growth.diff), targetCurrency)}).`,
        type: 'caution',
      });
    } else {
      insights.push({
        id: 'growth-stable',
        title: 'Estabilidade de faturamento',
        description: 'O faturamento deste período permaneceu equivalente ao período anterior.',
        type: 'neutral',
      });
    }
  }

  // 2. Best day of week
  const bestDayOfWeek = calculateBestDayOfWeek(currentTransactions, targetCurrency, rates);
  if (bestDayOfWeek && bestDayOfWeek.total > 0) {
    insights.push({
      id: 'best-day-week',
      title: `Melhor dia: ${bestDayOfWeek.dayName}`,
      description: `${bestDayOfWeek.dayName} concentra o maior volume financeiro, somando ${formatCurrency(bestDayOfWeek.total, targetCurrency)} no período.`,
      type: 'trend',
    });
  }

  // 3. Top category dominant share
  const categories = calculateCategoryDistribution(currentTransactions, targetCurrency, rates);
  if (categories.length > 0 && categories[0].percentage > 0) {
    const top = categories[0];
    insights.push({
      id: 'top-category',
      title: `${top.category} representa ${top.percentage}%`,
      description: `A categoria "${top.category}" lidera suas fontes de faturamento com ${formatCurrency(top.total, targetCurrency)} (${top.count} lançamentos).`,
      type: 'trend',
    });
  }

  // 4. Active days with revenue
  const daily = calculateDailyRevenue(currentTransactions, startDate, endDate, targetCurrency, rates);
  const activeDays = daily.filter((d) => d.amount > 0).length;
  const totalDays = daily.length;
  if (totalDays > 1) {
    const activePct = Math.round((activeDays / totalDays) * 100);
    insights.push({
      id: 'active-days',
      title: `${activeDays} de ${totalDays} dias com faturamento`,
      description: `Você registrou entradas financeiras em ${activePct}% dos dias deste intervalo analisado.`,
      type: activePct >= 50 ? 'positive' : 'neutral',
    });
  }

  // 5. Average ticket comparison
  const currentTicket = calculateAverageTicket(currentRevenue, currentTransactions.length);
  if (previousTransactions.length > 0) {
    const prevTicket = calculateAverageTicket(previousRevenue, previousTransactions.length);
    if (prevTicket > 0) {
      const ticketGrowth = Math.round(((currentTicket - prevTicket) / prevTicket) * 1000) / 10;
      if (ticketGrowth > 0) {
        insights.push({
          id: 'ticket-trend',
          title: `Ticket médio subiu +${ticketGrowth}%`,
          description: `O valor médio por lançamento subiu para ${formatCurrency(currentTicket, targetCurrency)} (era ${formatCurrency(prevTicket, targetCurrency)}).`,
          type: 'positive',
        });
      } else if (ticketGrowth < 0) {
        insights.push({
          id: 'ticket-trend-down',
          title: `Ticket médio recuou ${ticketGrowth}%`,
          description: `O valor médio por lançamento é atualmente ${formatCurrency(currentTicket, targetCurrency)} no período.`,
          type: 'neutral',
        });
      }
    }
  } else {
    insights.push({
      id: 'current-ticket',
      title: `Ticket médio de ${formatCurrency(currentTicket, targetCurrency)}`,
      description: `Média de receita gerada por lançamento com base em ${currentTransactions.length} registros.`,
      type: 'neutral',
    });
  }

  return insights;
}
