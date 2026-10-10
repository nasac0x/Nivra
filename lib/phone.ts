/**
 * Normalização de telefones para WhatsApp (wa.me) — com suporte internacional.
 *
 * O wa.me exige o número completo em formato internacional, só dígitos:
 * código do país + DDD/nacional + número. Sem isso, o link não resolve.
 *
 * Estratégia em camadas:
 * 1. Se já veio com código do país explícito (+55, +351, +1...), usa como está.
 * 2. Se veio sem "+", aplica heurística por comprimento:
 *    - 10–11 dígitos  → assume Brasil (55): celular BR tem 11 (55 9 XXXX-XXXX
 *      com o nono dígito) e fixo tem 10.
 *    - 12–15 dígitos → provavelmente já é internacional sem "+" (ex: 351...)
 *      — mantém como está.
 *    - 9 dígitos     → pode ser Portugal sem código (9XXXXXXXX). Só assume
 *      351 se `defaultCountry` for '351'; senão assume 55 (BR).
 * 3. O `defaultCountry` muda a regra: quem prospecta em Portugal passa
 *    '351' e números de 9 dígitos ganham +351 em vez de +55.
 *
 * IMPORTANTE (limites honestos da heurística):
 * - Um número salvo SEM código de país é ambíguo por natureza. Ex: 9 dígitos
 *   "912345678" pode ser PT (351) ou o nono dígito de um celular BR sem DDD.
 *   A heurística acerta o caso comum do seu fluxo de uso, mas o dado certo
 *   é salvar já com "+". A camada 1 (fonte: Google Places) é a mais confiável.
 * - Por isso o badge visual: quando o número salvo não tinha "+" e a
 *   normalização precisou adivinhar, marcamos `guess: true` para a UI
 *   sinalizar ao usuário.
 */

/** DDIs comuns para prospecção — chave ISO, valor código. */
export const COUNTRY_CODES: Record<string, string> = {
  BR: '55',
  PT: '351',
  ES: '34',
  FR: '33',
  IT: '39',
  DE: '49',
  US: '1',
  CA: '1',
  MX: '52',
  AR: '54',
  CL: '56',
  CO: '57',
  UK: '44',
  NL: '31',
};

export interface PhoneAnalysis {
  /** E164-like, apenas dígitos: ex '5521988441234'. Pronto para wa.me. */
  e164: string;
  /** Link wa.me completo, ou null se não der para montar nada confiável. */
  whatsappUrl: string | null;
  /** true se o número salvo já tinha "+" (confiável). */
  hadCountryCode: boolean;
  /** true se a normalização precisou adivinhar o país. */
  guess: boolean;
  /** DDI aplicado na normalização. */
  country: string | null;
}

/**
 * Analisa um telefone bruto (como está salvo no prospect) e devolve
 * o número normalizado + diagnóstico para a UI.
 */
export function analyzePhone(raw: string, defaultCountry = '55'): PhoneAnalysis {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return { e164: '', whatsappUrl: null, hadCountryCode: false, guess: false, country: null };
  }

  const hadCountryCode = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (hadCountryCode && digits.length >= 8) {
    // Caso 1: veio com "+" — confia nele.
    return {
      e164: digits,
      whatsappUrl: `https://wa.me/${digits}`,
      hadCountryCode: true,
      guess: false,
      country: digits.slice(0, 2) || null,
    };
  }

  // Caso 2: heurística por comprimento, sem "+".
  if (digits.length === 10 || digits.length === 11) {
    // Padrão brasileiro: DDD (2) + 8/9 dígitos.
    const e164 = `55${digits}`;
    return {
      e164,
      whatsappUrl: `https://wa.me/${e164}`,
      hadCountryCode: false,
      guess: true,
      country: '55',
    };
  }

  if (digits.length === 9) {
    // Ambíguo: PT (9 dígitos) vs celular BR sem DDD (raro salvar assim).
    // Decide pelo defaultCountry: quem prospecta em PT passa '351'.
    const cc = defaultCountry === '351' ? '351' : '55';
    const e164 = `${cc}${digits}`;
    return {
      e164,
      whatsappUrl: `https://wa.me/${e164}`,
      hadCountryCode: false,
      guess: true,
      country: cc,
    };
  }

  if (digits.length >= 12 && digits.length <= 15) {
    // Já parece internacional sem "+": ex '351912345678', '14155551234'.
    return {
      e164: digits,
      whatsappUrl: `https://wa.me/${digits}`,
      hadCountryCode: false,
      guess: false,
      country: null,
    };
  }

  // Comprimento incompreensível (muito curto): não monta link ruim.
  return { e164: '', whatsappUrl: null, hadCountryCode: false, guess: false, country: null };
}

/**
 * Helper direto: devolve só a URL do WhatsApp, ou null.
 * Mantém a migração dos dados salvos triviaz de usar.
 */
export function whatsappUrlFor(raw: string, defaultCountry = '55'): string | null {
  return analyzePhone(raw, defaultCountry).whatsappUrl;
}

/**
 * Camada 3 — normalização na GRAVAÇÃO (ProspectModal.save):
 * salva o telefone sempre com "+" quando der para inferir o código do país,
 * para o dado armazenado ficar confiável de vez.
 *
 * - "+55 21 98844-1234"  → "+55 21 98844-1234" (já certo, só limpa espaços duplos)
 * - "21988441234"        → "+55 21 98844-1234" (10-11 dígitos: BR)
 * - "912345678" (PT)     → "+351 912 345 678"  (9 dígitos + defaultCountry '351')
 * - "351912345678"       → "+351 912 345 678"  (já internacional sem +)
 * - lixo/curto demais     → devolve como veio (não inventa)
 */
export function normalizePhoneOnSave(raw: string, defaultCountry = '55'): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';

  const analysis = analyzePhone(trimmed, defaultCountry);
  if (!analysis.e164) return trimmed; // não dá pra inferir com segurança

  // Preserva a formatação que já veio com "+": só normaliza espaços.
  if (analysis.hadCountryCode) return trimmed.replace(/\s+/g, ' ');

  // Inferiu o país: reconstrói bonito, "+CC ddd número".
  const cc = analysis.country || '';
  const rest = analysis.e164.slice(cc.length);
  return `+${cc} ${rest}`.trim();
}
