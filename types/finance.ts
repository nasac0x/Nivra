export type Currency = 'USD' | 'BRL' | 'EUR';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: Currency;
  convertedAmount: number;
  category: string;
  description: string;
  notes: string;
  createdAt: string; // ISO string
}

export interface ExchangeRates {
  USD_BRL: number;
  USD_EUR: number;
  EUR_BRL: number;
  lastUpdated: string; // ISO or date string
  isManual: boolean;
}

export type DatePeriod = 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export type ChartInterval = '7d' | '30d' | '90d' | '6m' | '1y';

export type DashboardModuleId =
  | 'main_revenue'
  | 'revenue_chart'
  | 'quick_add'
  | 'metrics_summary'
  | 'goals'
  | 'insights'
  | 'category_distribution'
  | 'history_table';

export type ModuleWidth = 'full' | 'half' | 'third' | 'two-thirds';

export interface ModuleConfig {
  id: DashboardModuleId;
  title: string;
  visible: boolean;
  order: number;
  width: ModuleWidth;
}

export interface FinancialGoals {
  monthly: number;
  weekly: number;
  annual: number;
}

export interface UserSettings {
  defaultCurrency: Currency;
  categories: string[];
  goals: FinancialGoals;
  exchangeRates: ExchangeRates;
  modules: ModuleConfig[];
}

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'caution' | 'trend';
}
