/**
 * COTAÇÃO ONLINE — APIs gratuitas, sem chave, direto do navegador.
 *
 * Cadeia de fallback (política: se uma falha, tenta a próxima):
 *  1. open.er-api.com  — rates diários completos (primária)
 *  2. api.frankfurter.app — Banco Central Europeu (fallback)
 *
 * CORS liberado por ambas → pode chamar do client.
 */

export interface OnlineRates {
  USD_BRL: number;
  USD_EUR: number;
  EUR_BRL: number;
  source: string;
  fetchedAt: string; // ISO
}

async function fromErApi(): Promise<OnlineRates> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error(`er-api HTTP ${res.status}`);
  const data = await res.json();
  const brl = Number(data?.rates?.BRL);
  const eur = Number(data?.rates?.EUR);
  if (!brl || !eur) throw new Error('er-api sem rates');
  return {
    USD_BRL: brl,
    USD_EUR: eur,
    EUR_BRL: brl / eur,
    source: 'open.er-api.com',
    fetchedAt: new Date().toISOString(),
  };
}

async function fromFrankfurter(): Promise<OnlineRates> {
  const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL,EUR');
  if (!res.ok) throw new Error(`frankfurter HTTP ${res.status}`);
  const data = await res.json();
  const brl = Number(data?.rates?.BRL);
  const eur = Number(data?.rates?.EUR);
  if (!brl || !eur) throw new Error('frankfurter sem rates');
  return {
    USD_BRL: brl,
    USD_EUR: eur,
    EUR_BRL: brl / eur,
    source: 'frankfurter.app (ECB)',
    fetchedAt: new Date().toISOString(),
  };
}

/** Busca cotação com fallback automático. Lança se TODAS falharem. */
export async function fetchOnlineRates(): Promise<OnlineRates> {
  const providers = [fromErApi, fromFrankfurter];
  const errors: string[] = [];
  for (const provider of providers) {
    try {
      return await provider();
    } catch (err: any) {
      errors.push(`${provider.name}: ${err?.message || err}`);
    }
  }
  throw new Error('Falha em todas as fontes de cotação: ' + errors.join(' | '));
}
