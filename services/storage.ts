import { Transaction, UserSettings, ModuleConfig } from '@/types/finance';
import { DEFAULT_EXCHANGE_RATES } from './currency';
import { getLocalTodayString } from './metrics';

const TRANSACTIONS_KEY = 'aura_finance_transactions_v1';
const SETTINGS_KEY = 'aura_finance_settings_v1';

export const DEFAULT_MODULES: ModuleConfig[] = [
  { id: 'main_revenue', title: 'Faturamento Principal', visible: true, order: 0, width: 'full' },
  { id: 'quick_add', title: 'Adição Rápida', visible: true, order: 1, width: 'full' },
  { id: 'revenue_chart', title: 'Gráfico Diário', visible: true, order: 2, width: 'full' },
  { id: 'metrics_summary', title: 'Métricas de Performance', visible: true, order: 3, width: 'full' },
  { id: 'goals', title: 'Metas Financeiras', visible: true, order: 4, width: 'half' },
  { id: 'insights', title: 'Insights Automáticos', visible: true, order: 5, width: 'half' },
  { id: 'category_distribution', title: 'Distribuição por Categoria', visible: true, order: 6, width: 'full' },
  { id: 'history_table', title: 'Histórico de Faturamento', visible: true, order: 7, width: 'full' },
];

export const DEFAULT_CATEGORIES = [
  'Website',
  'Design',
  'Freelance',
  'Consultoria',
  'Produto',
  'Serviço',
  'Outros',
];

export const DEFAULT_SETTINGS: UserSettings = {
  defaultCurrency: 'USD',
  categories: DEFAULT_CATEGORIES,
  goals: {
    monthly: 5000,
    weekly: 1250,
    annual: 60000,
  },
  exchangeRates: DEFAULT_EXCHANGE_RATES,
  modules: DEFAULT_MODULES,
};

export function getStoredTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list: Transaction[] = Array.isArray(parsed) ? parsed : [];

    // Auto-heal dates: compute local today
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let hasRepaired = false;
    const sanitized = list.map((tx) => {
      // If date was stored with tomorrow's date due to previous UTC split bug, heal it to local today
      if (tx.date > localToday) {
        hasRepaired = true;
        return { ...tx, date: localToday };
      }
      return tx;
    });

    if (hasRepaired) {
      try {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(sanitized));
      } catch {}
    }

    return sanitized;
  } catch (err) {
    console.error('Erro ao ler transações do localStorage', err);
    return [];
  }
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Erro ao salvar transações no localStorage', err);
  }
}

export function getStoredSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);

    // Merge in case new module or setting keys were added
    const storedModules: ModuleConfig[] = parsed.modules || [];
    const mergedModules: ModuleConfig[] = DEFAULT_MODULES.map(defMod => {
      const found = storedModules.find(m => m.id === defMod.id);
      return found ? { ...defMod, ...found } : defMod;
    });

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
      modules: mergedModules.sort((a, b) => a.order - b.order),
      exchangeRates: {
        ...DEFAULT_EXCHANGE_RATES,
        ...(parsed.exchangeRates || {}),
      },
      goals: {
        ...DEFAULT_SETTINGS.goals,
        ...(parsed.goals || {}),
      },
    };
  } catch (err) {
    console.error('Erro ao ler configurações do localStorage', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Erro ao salvar configurações no localStorage', err);
  }
}

export function exportBackupJSON(transactions: Transaction[], settings: UserSettings): void {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    transactions,
    settings,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `backup-financeiro-nivra-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importBackupJSON(jsonStr: string): { transactions: Transaction[]; settings: UserSettings } | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.transactions)) {
      throw new Error('Arquivo JSON inválido: campo "transactions" não encontrado.');
    }
    
    // Validate transactions structure
    const validTransactions: Transaction[] = parsed.transactions.filter((t: any) => 
      t && typeof t.id === 'string' && typeof t.amount === 'number' && typeof t.date === 'string'
    );

    const mergedSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings || {}),
    };

    return {
      transactions: validTransactions,
      settings: mergedSettings,
    };
  } catch (err) {
    console.error('Erro ao importar backup JSON', err);
    return null;
  }
}

export function resetAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TRANSACTIONS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

/**
 * Curated starter demo data for users wanting to explore without typing 20 transactions manually
 */
export function getSampleDemoTransactions(): Transaction[] {
  const formatOffsetDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return getLocalTodayString(d);
  };

  return [
    {
      id: 'tx-1',
      date: formatOffsetDate(0),
      amount: 480,
      currency: 'USD',
      convertedAmount: 480,
      category: 'Website',
      description: 'Landing Page SaaS AI',
      notes: 'Projeto entregue com aprovação imediata',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      date: formatOffsetDate(1),
      amount: 210,
      currency: 'USD',
      convertedAmount: 210,
      category: 'Design',
      description: 'Design de Ícones e Identidade',
      notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-3',
      date: formatOffsetDate(2),
      amount: 1850,
      currency: 'BRL',
      convertedAmount: 342.59,
      category: 'Consultoria',
      description: 'Consultoria Arquitetura Next.js',
      notes: 'Cliente de São Paulo',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-4',
      date: formatOffsetDate(3),
      amount: 120,
      currency: 'USD',
      convertedAmount: 120,
      category: 'Freelance',
      description: 'Ajuste de performance Core Web Vitals',
      notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-5',
      date: formatOffsetDate(5),
      amount: 650,
      currency: 'EUR',
      convertedAmount: 706.52,
      category: 'Website',
      description: 'E-commerce Custom Checkout',
      notes: 'Contrato internacional',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-6',
      date: formatOffsetDate(7),
      amount: 320,
      currency: 'USD',
      convertedAmount: 320,
      category: 'Design',
      description: 'UI Kit Figma Design System',
      notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-7',
      date: formatOffsetDate(10),
      amount: 1500,
      currency: 'USD',
      convertedAmount: 1500,
      category: 'Website',
      description: 'Redesenho Portal Corporativo',
      notes: 'Segunda parcela do projeto',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-8',
      date: formatOffsetDate(14),
      amount: 450,
      currency: 'EUR',
      convertedAmount: 489.13,
      category: 'Consultoria',
      description: 'Auditoria de Acessibilidade e SEO',
      notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-9',
      date: formatOffsetDate(18),
      amount: 2700,
      currency: 'BRL',
      convertedAmount: 500,
      category: 'Serviço',
      description: 'Manutenção Mensal Servidores',
      notes: 'Retainer contratual',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-10',
      date: formatOffsetDate(24),
      amount: 800,
      currency: 'USD',
      convertedAmount: 800,
      category: 'Produto',
      description: 'Vendas de Templates Tailwind',
      notes: 'Gumroad e Stripe',
      createdAt: new Date().toISOString(),
    },
  ];
}
