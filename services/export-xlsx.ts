import * as XLSX from 'xlsx';
import { Transaction, Currency, ExchangeRates } from '@/types/finance';
import { convertCurrency, formatCurrency } from './currency';
import {
  calculateTotalRevenue,
  calculateDailyRevenue,
  calculateAverageRevenue,
  calculateAverageTicket,
  calculateBestDay,
  calculateWorstDay,
  calculatePeriodGrowth,
  calculateCategoryDistribution,
  DailyPoint,
} from './metrics';

export interface ExportDataOptions {
  transactions: Transaction[];
  previousTransactions: Transaction[];
  targetCurrency: Currency;
  rates: ExchangeRates;
  periodLabel: string;
  startDate: string;
  endDate: string;
}

export function exportToXLSX(options: ExportDataOptions): void {
  const {
    transactions,
    previousTransactions,
    targetCurrency,
    rates,
    periodLabel,
    startDate,
    endDate,
  } = options;

  const currentTotal = calculateTotalRevenue(transactions, targetCurrency, rates);
  const previousTotal = calculateTotalRevenue(previousTransactions, targetCurrency, rates);
  const dailyPoints: DailyPoint[] = calculateDailyRevenue(transactions, startDate, endDate, targetCurrency, rates);
  const daysCount = dailyPoints.length || 1;
  const avgDaily = calculateAverageRevenue(currentTotal, daysCount);
  const avgTicket = calculateAverageTicket(currentTotal, transactions.length);
  const bestDay = calculateBestDay(dailyPoints);
  const worstDay = calculateWorstDay(dailyPoints);
  const growth = calculatePeriodGrowth(currentTotal, previousTotal);
  const categories = calculateCategoryDistribution(transactions, targetCurrency, rates);

  const wb = XLSX.utils.book_new();

  // 1. Aba Resumo
  const resumoRows = [
    { Indicador: 'RELATÓRIO FINANCEIRO EXECUTIVO', Valor: '' },
    { Indicador: 'Período Analisado', Valor: periodLabel },
    { Indicador: 'Intervalo de Datas', Valor: `${startDate} até ${endDate}` },
    { Indicador: 'Moeda Principal', Valor: targetCurrency },
    { Indicador: 'Data da Exportação', Valor: new Date().toLocaleDateString('pt-BR') },
    { Indicador: '----------------------------------------', Valor: '--------------------' },
    { Indicador: 'Faturamento Total', Valor: formatCurrency(currentTotal, targetCurrency) },
    { Indicador: 'Faturamento Médio Diário', Valor: formatCurrency(avgDaily, targetCurrency) },
    { Indicador: 'Ticket Médio', Valor: formatCurrency(avgTicket, targetCurrency) },
    { Indicador: 'Quantidade de Lançamentos', Valor: transactions.length },
    { Indicador: 'Maior Faturamento Diário', Valor: bestDay ? `${formatCurrency(bestDay.amount, targetCurrency)} (${bestDay.date})` : 'N/A' },
    { Indicador: 'Menor Faturamento Diário (ativo)', Valor: worstDay ? `${formatCurrency(worstDay.amount, targetCurrency)} (${worstDay.date})` : 'N/A' },
    { Indicador: 'Variação vs Período Anterior', Valor: `${growth.isPositive ? '+' : ''}${growth.percentage}%` },
    { Indicador: 'Faturamento Período Anterior', Valor: formatCurrency(previousTotal, targetCurrency) },
  ];
  const wsResumo = XLSX.utils.json_to_sheet(resumoRows);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // 2. Aba Faturamento (todos os lançamentos)
  const faturamentoRows = transactions.map((t) => {
    const converted = convertCurrency(t.amount, t.currency, targetCurrency, rates);
    return {
      ID: t.id,
      Data: t.date,
      Descrição: t.description || 'Sem descrição',
      Categoria: t.category || 'Sem categoria',
      'Moeda Original': t.currency,
      'Valor Original': t.amount,
      [`Valor Convertido (${targetCurrency})`]: Math.round(converted * 100) / 100,
      Observações: t.notes || '',
      'Criado Em': t.createdAt,
    };
  });
  const wsFaturamento = XLSX.utils.json_to_sheet(
    faturamentoRows.length > 0
      ? faturamentoRows
      : [{ Aviso: 'Nenhum lançamento no período selecionado' }]
  );
  XLSX.utils.book_append_sheet(wb, wsFaturamento, 'Faturamento');

  // 3. Aba Categorias
  const categoriaRows = categories.map((c) => ({
    Categoria: c.category,
    [`Faturamento Total (${targetCurrency})`]: Math.round(c.total * 100) / 100,
    'Percentual (%)': `${c.percentage}%`,
    'Quantidade de Lançamentos': c.count,
  }));
  const wsCategorias = XLSX.utils.json_to_sheet(
    categoriaRows.length > 0
      ? categoriaRows
      : [{ Aviso: 'Nenhuma categoria com faturamento' }]
  );
  XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorias');

  // 4. Aba Histórico Diário
  const diarioRows = dailyPoints.map((dp) => ({
    Data: dp.date,
    [`Faturamento (${targetCurrency})`]: Math.round(dp.amount * 100) / 100,
    'Quantidade de Transações': dp.count,
  }));
  const wsDiario = XLSX.utils.json_to_sheet(diarioRows);
  XLSX.utils.book_append_sheet(wb, wsDiario, 'Histórico Diário');

  // Set column widths for readability
  [wsResumo, wsFaturamento, wsCategorias, wsDiario].forEach((ws) => {
    ws['!cols'] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 30 },
    ];
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `relatorio-financeiro-${todayStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}
