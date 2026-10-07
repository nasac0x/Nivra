import { Transaction, Currency, ExchangeRates, DatePeriod } from '@/types/finance';
import { convertCurrency } from './currency';

export interface DailyPoint {
  date: string;
  label: string;
  amount: number;
  count: number;
}

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in the user's LOCAL timezone
 */
export function getLocalTodayString(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates sum of all given transactions converted into target currency
 */
export function calculateTotalRevenue(
  transactions: Transaction[],
  targetCurrency: Currency,
  rates: ExchangeRates
): number {
  return transactions.reduce((acc, tx) => {
    const val = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
    return acc + val;
  }, 0);
}

/**
 * Calculates daily breakdown of revenue between startDate and endDate
 */
export function calculateDailyRevenue(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
  targetCurrency: Currency,
  rates: ExchangeRates
): DailyPoint[] {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');

  // Build map of existing transactions aggregated by date
  const dateMap = new Map<string, { amount: number; count: number }>();

  transactions.forEach((tx) => {
    const txDate = tx.date;
    if (txDate >= startDate && txDate <= endDate) {
      const converted = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
      const current = dateMap.get(txDate) || { amount: 0, count: 0 };
      dateMap.set(txDate, {
        amount: current.amount + converted,
        count: current.count + 1,
      });
    }
  });

  // Generate sequence of dates from start to end
  const points: DailyPoint[] = [];
  const curr = new Date(start);
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

  // Limit max days to avoid performance issues if someone selects a huge range
  let maxLoop = 366;
  while (curr <= end && maxLoop > 0) {
    maxLoop--;
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const data = dateMap.get(dateKey) || { amount: 0, count: 0 };
    points.push({
      date: dateKey,
      label: formatter.format(curr),
      amount: data.amount,
      count: data.count,
    });

    curr.setDate(curr.getDate() + 1);
  }

  return points;
}

/**
 * Calculates average revenue per day
 */
export function calculateAverageRevenue(
  totalRevenue: number,
  daysInPeriod: number
): number {
  if (daysInPeriod <= 0) return 0;
  return totalRevenue / daysInPeriod;
}

/**
 * Calculates average ticket (revenue per transaction)
 */
export function calculateAverageTicket(
  totalRevenue: number,
  transactionCount: number
): number {
  if (transactionCount <= 0) return 0;
  return totalRevenue / transactionCount;
}

/**
 * Identifies highest revenue day from daily points (only days with > 0 or max)
 */
export function calculateBestDay(dailyRevenue: DailyPoint[]): { date: string; amount: number } | null {
  if (!dailyRevenue.length) return null;
  let best = dailyRevenue[0];
  for (const pt of dailyRevenue) {
    if (pt.amount > best.amount) {
      best = pt;
    }
  }
  return best.amount > 0 ? { date: best.date, amount: best.amount } : null;
}

/**
 * Identifies lowest revenue day among active days with revenue
 */
export function calculateWorstDay(dailyRevenue: DailyPoint[]): { date: string; amount: number } | null {
  const activeDays = dailyRevenue.filter(p => p.amount > 0);
  if (!activeDays.length) return null;
  let worst = activeDays[0];
  for (const pt of activeDays) {
    if (pt.amount < worst.amount) {
      worst = pt;
    }
  }
  return { date: worst.date, amount: worst.amount };
}

/**
 * Calculates best day of week (Domingo, Segunda, etc.)
 */
export function calculateBestDayOfWeek(
  transactions: Transaction[],
  targetCurrency: Currency,
  rates: ExchangeRates
): { dayName: string; total: number } | null {
  if (!transactions.length) return null;

  const dayTotals: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const dayNames = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  transactions.forEach((tx) => {
    const d = new Date(tx.date + 'T12:00:00');
    const dayIndex = d.getDay();
    const converted = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
    dayTotals[dayIndex] = (dayTotals[dayIndex] || 0) + converted;
  });

  let bestDayIndex = 0;
  let highest = -1;
  for (let i = 0; i <= 6; i++) {
    if (dayTotals[i] > highest) {
      highest = dayTotals[i];
      bestDayIndex = i;
    }
  }

  if (highest <= 0) return null;
  return { dayName: dayNames[bestDayIndex], total: highest };
}

/**
 * Calculates growth percentage compared to previous equivalent period
 */
export function calculatePeriodGrowth(
  currentRevenue: number,
  previousRevenue: number
): { percentage: number; isPositive: boolean; diff: number } {
  const diff = currentRevenue - previousRevenue;
  if (previousRevenue <= 0) {
    return {
      percentage: currentRevenue > 0 ? 100 : 0,
      isPositive: currentRevenue >= 0,
      diff,
    };
  }

  const percentage = (diff / previousRevenue) * 100;
  return {
    percentage: Math.round(percentage * 10) / 10,
    isPositive: diff >= 0,
    diff,
  };
}

/**
 * Calculates revenue distribution by category
 */
export function calculateCategoryDistribution(
  transactions: Transaction[],
  targetCurrency: Currency,
  rates: ExchangeRates
): CategorySummary[] {
  const categoryMap = new Map<string, { total: number; count: number }>();
  let grandTotal = 0;

  transactions.forEach((tx) => {
    const cat = tx.category.trim() || 'Sem categoria';
    const converted = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
    grandTotal += converted;

    const existing = categoryMap.get(cat) || { total: 0, count: 0 };
    categoryMap.set(cat, {
      total: existing.total + converted,
      count: existing.count + 1,
    });
  });

  const list: CategorySummary[] = [];
  categoryMap.forEach((val, cat) => {
    const percentage = grandTotal > 0 ? Math.round((val.total / grandTotal) * 1000) / 10 : 0;
    list.push({
      category: cat,
      total: val.total,
      percentage,
      count: val.count,
    });
  });

  return list.sort((a, b) => b.total - a.total);
}

/**
 * Calculates median of an array of numbers
 */
export function calculateMedian(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export interface ValueBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  total: number;
  percentage: number;
}

/**
 * Calculates distribution of transaction values across standardized financial tiers
 */
export function calculateValueBuckets(
  transactions: Transaction[],
  targetCurrency: Currency,
  rates: ExchangeRates
): ValueBucket[] {
  const tiers = [
    { label: 'Até 100', min: 0, max: 100 },
    { label: '100 a 500', min: 100, max: 500 },
    { label: '500 a 1.500', min: 500, max: 1500 },
    { label: '1.500 a 5.000', min: 1500, max: 5000 },
    { label: 'Acima de 5.000', min: 5000, max: Infinity },
  ];

  let grandTotal = 0;
  const buckets: ValueBucket[] = tiers.map((t) => ({
    label: t.label,
    min: t.min,
    max: t.max,
    count: 0,
    total: 0,
    percentage: 0,
  }));

  transactions.forEach((tx) => {
    const val = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
    grandTotal += val;

    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      if (val >= b.min && (val < b.max || b.max === Infinity)) {
        b.count++;
        b.total += val;
        break;
      }
    }
  });

  buckets.forEach((b) => {
    b.percentage = grandTotal > 0 ? Math.round((b.total / grandTotal) * 1000) / 10 : 0;
  });

  return buckets;
}

/**
 * Calculates share of top 3 and top 5 transactions in total revenue
 */
export function calculateTopConcentration(
  transactions: Transaction[],
  targetCurrency: Currency,
  rates: ExchangeRates
): { top3Total: number; top3Pct: number; top5Total: number; top5Pct: number } {
  if (!transactions.length) {
    return { top3Total: 0, top3Pct: 0, top5Total: 0, top5Pct: 0 };
  }

  const converted = transactions
    .map((t) => convertCurrency(t.amount, t.currency, targetCurrency, rates))
    .sort((a, b) => b - a);

  const grandTotal = converted.reduce((acc, v) => acc + v, 0);
  const top3Total = converted.slice(0, 3).reduce((acc, v) => acc + v, 0);
  const top5Total = converted.slice(0, 5).reduce((acc, v) => acc + v, 0);

  return {
    top3Total,
    top3Pct: grandTotal > 0 ? Math.round((top3Total / grandTotal) * 1000) / 10 : 0,
    top5Total,
    top5Pct: grandTotal > 0 ? Math.round((top5Total / grandTotal) * 1000) / 10 : 0,
  };
}

/**
 * Calculates cumulative daily revenue series
 */
export function calculateCumulativeDailyPoints(
  points: DailyPoint[]
): { date: string; label: string; daily: number; cumulative: number }[] {
  let acc = 0;
  return points.map((p) => {
    acc += p.amount;
    return {
      date: p.date,
      label: p.label,
      daily: p.amount,
      cumulative: Math.round(acc * 100) / 100,
    };
  });
}

/**
 * Calculates 7-day moving average along daily points
 */
export function calculate7DayMovingAverage(
  points: DailyPoint[]
): { date: string; label: string; amount: number; movingAvg: number }[] {
  return points.map((p, idx) => {
    const windowStart = Math.max(0, idx - 6);
    const windowPoints = points.slice(windowStart, idx + 1);
    const sum = windowPoints.reduce((acc, curr) => acc + curr.amount, 0);
    const movingAvg = sum / windowPoints.length;
    return {
      date: p.date,
      label: p.label,
      amount: p.amount,
      movingAvg: Math.round(movingAvg * 100) / 100,
    };
  });
}

/**
 * Calculates average interval in days between distinct transaction events
 */
export function calculateAverageIntervalBetweenTransactions(
  transactions: Transaction[]
): number | null {
  if (transactions.length < 2) return null;
  const uniqueDates = Array.from(new Set(transactions.map((t) => t.date))).sort();
  if (uniqueDates.length < 2) return 0;

  let totalDiffDays = 0;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const d1 = new Date(uniqueDates[i] + 'T12:00:00');
    const d2 = new Date(uniqueDates[i + 1] + 'T12:00:00');
    const diff = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    totalDiffDays += diff;
  }

  return Math.round((totalDiffDays / (uniqueDates.length - 1)) * 10) / 10;
}

export function calculateGoalProgress(
  current: number,
  goal: number
): { current: number; goal: number; percentage: number; achieved: boolean; remaining: number } {
  if (goal <= 0) {
    return { current, goal: 0, percentage: 100, achieved: true, remaining: 0 };
  }
  const percentage = Math.min(Math.round((current / goal) * 1000) / 10, 1000);
  const remaining = Math.max(0, goal - current);
  return {
    current,
    goal,
    percentage,
    achieved: current >= goal,
    remaining,
  };
}

/**
 * Get date range bounds and previous comparison range for any selected period
 */
export function getDateRangeForPeriod(
  period: DatePeriod,
  customRange?: { start: string; end: string }
): { start: string; end: string; prevStart: string; prevEnd: string; label: string; daysCount: number } {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth();
  const dd = today.getDate();

  const toStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (period === 'today') {
    const currStr = toStr(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const prevStr = toStr(yesterday);
    return {
      start: currStr,
      end: currStr,
      prevStart: prevStr,
      prevEnd: prevStr,
      label: 'Hoje',
      daysCount: 1,
    };
  }

  if (period === '7d') {
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(start.getDate() - 6);

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 6);

    return {
      start: toStr(start),
      end: toStr(end),
      prevStart: toStr(prevStart),
      prevEnd: toStr(prevEnd),
      label: 'Últimos 7 dias',
      daysCount: 7,
    };
  }

  if (period === '30d') {
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(start.getDate() - 29);

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 29);

    return {
      start: toStr(start),
      end: toStr(end),
      prevStart: toStr(prevStart),
      prevEnd: toStr(prevEnd),
      label: 'Últimos 30 dias',
      daysCount: 30,
    };
  }

  if (period === 'this_month') {
    const start = new Date(yyyy, mm, 1);
    const end = new Date(yyyy, mm + 1, 0); // Last day of month
    const daysInMonth = end.getDate();

    // Previous month
    const prevStart = new Date(yyyy, mm - 1, 1);
    const prevEnd = new Date(yyyy, mm, 0);

    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(today);
    const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return {
      start: toStr(start),
      end: toStr(end),
      prevStart: toStr(prevStart),
      prevEnd: toStr(prevEnd),
      label: `Este mês (${capMonth})`,
      daysCount: daysInMonth,
    };
  }

  if (period === 'last_month') {
    const start = new Date(yyyy, mm - 1, 1);
    const end = new Date(yyyy, mm, 0);
    const daysCount = end.getDate();

    // Month before last
    const prevStart = new Date(yyyy, mm - 2, 1);
    const prevEnd = new Date(yyyy, mm - 1, 0);

    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(start);
    const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return {
      start: toStr(start),
      end: toStr(end),
      prevStart: toStr(prevStart),
      prevEnd: toStr(prevEnd),
      label: `Mês passado (${capMonth})`,
      daysCount,
    };
  }

  if (period === 'this_year') {
    const start = new Date(yyyy, 0, 1);
    const end = new Date(yyyy, 11, 31);
    const prevStart = new Date(yyyy - 1, 0, 1);
    const prevEnd = new Date(yyyy - 1, 11, 31);

    return {
      start: toStr(start),
      end: toStr(end),
      prevStart: toStr(prevStart),
      prevEnd: toStr(prevEnd),
      label: `Este ano (${yyyy})`,
      daysCount: 365,
    };
  }

  // Custom period
  if (customRange && customRange.start && customRange.end) {
    const start = new Date(customRange.start + 'T00:00:00');
    const end = new Date(customRange.end + 'T23:59:59');
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (diffDays - 1));

    const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    return {
      start: customRange.start,
      end: customRange.end,
      prevStart: toStr(prevStart),
      prevEnd: toStr(prevEnd),
      label: `${fmt.format(start)} — ${fmt.format(end)}`,
      daysCount: diffDays,
    };
  }

  // Default fallback to 30d
  const fallbackEnd = new Date(today);
  const fallbackStart = new Date(today);
  fallbackStart.setDate(fallbackStart.getDate() - 29);
  return {
    start: toStr(fallbackStart),
    end: toStr(fallbackEnd),
    prevStart: toStr(fallbackStart),
    prevEnd: toStr(fallbackEnd),
    label: 'Últimos 30 dias',
    daysCount: 30,
  };
}
