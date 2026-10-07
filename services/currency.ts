import { Currency, ExchangeRates } from '@/types/finance';

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD_BRL: 5.40,
  USD_EUR: 0.92,
  EUR_BRL: 5.87,
  lastUpdated: new Date().toISOString(),
  isManual: true,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  BRL: 'R$',
  EUR: '€',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'Dólar Americano',
  BRL: 'Real Brasileiro',
  EUR: 'Euro',
};

/**
 * Format numerical amount into standard currency display
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  
  if (currency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  }

  if (currency === 'EUR') {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  }

  // USD default
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

/**
 * Convert value from one currency to target currency using available rates
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): number {
  if (from === to) return amount;
  if (!amount || isNaN(amount)) return 0;

  const usdToBrl = rates.USD_BRL > 0 ? rates.USD_BRL : 5.40;
  const usdToEur = rates.USD_EUR > 0 ? rates.USD_EUR : 0.92;
  const eurToBrl = rates.EUR_BRL > 0 ? rates.EUR_BRL : (usdToBrl / usdToEur);

  // Convert from origin to USD first (base pivot)
  let amountInUSD = amount;
  if (from === 'BRL') {
    amountInUSD = amount / usdToBrl;
  } else if (from === 'EUR') {
    amountInUSD = amount / usdToEur;
  }

  // Convert from USD to target
  if (to === 'USD') {
    return amountInUSD;
  } else if (to === 'BRL') {
    return amountInUSD * usdToBrl;
  } else if (to === 'EUR') {
    return amountInUSD * usdToEur;
  }

  return amount;
}
