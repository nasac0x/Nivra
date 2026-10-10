import { describe, expect, test } from 'bun:test';
import { analyzePhone, whatsappUrlFor, normalizePhoneOnSave } from './phone';

describe('analyzePhone / whatsappUrlFor — números BR', () => {
  test('legado sem + (10 dígitos): ganha 55 e badge de adivinhação', () => {
    const r = analyzePhone('21 98844-1234');
    expect(r.e164).toBe('5521988441234');
    expect(r.whatsappUrl).toBe('https://wa.me/5521988441234');
    expect(r.hadCountryCode).toBe(false);
    expect(r.guess).toBe(true);
    expect(r.country).toBe('55');
  });

  test('legado sem + (11 dígitos, celular com nono dígito)', () => {
    const r = analyzePhone('11987654321');
    expect(r.e164).toBe('5511987654321');
    expect(r.guess).toBe(true);
  });

  test('com +55: confia no que veio', () => {
    const r = analyzePhone('+55 21 99123-4567');
    expect(r.e164).toBe('5521991234567');
    expect(r.hadCountryCode).toBe(true);
    expect(r.guess).toBe(false);
  });

  test('55 colado sem + (12+ dígitos): já é internacional', () => {
    const r = analyzePhone('5521988441234');
    expect(r.e164).toBe('5521988441234');
    expect(r.guess).toBe(false);
  });
});

describe('analyzePhone — números de Portugal', () => {
  test('com +351: confia', () => {
    const r = analyzePhone('+351 912 345 678');
    expect(r.e164).toBe('351912345678');
    expect(r.hadCountryCode).toBe(true);
  });

  test('9 dígitos sem + com defaultCountry 351 (cenario Portugal)', () => {
    const r = analyzePhone('912 345 678', '351');
    expect(r.e164).toBe('351912345678');
    expect(r.guess).toBe(true);
    expect(r.country).toBe('351');
  });

  test('9 dígitos sem + com default BR: assume 55 (ambiguidade documentada)', () => {
    const r = analyzePhone('912 345 678', '55');
    expect(r.e164).toBe('55912345678');
    expect(r.guess).toBe(true);
  });

  test('351 colado sem + (12 dígitos): internacional como está', () => {
    const r = analyzePhone('351912345678');
    expect(r.e164).toBe('351912345678');
    expect(r.guess).toBe(false);
  });
});

describe('analyzePhone — casos ruins', () => {
  test('lixo curto: NÃO gera link (não inventa)', () => {
    const r = analyzePhone('123');
    expect(r.whatsappUrl).toBeNull();
  });

  test('vazio', () => {
    expect(analyzePhone('').whatsappUrl).toBeNull();
    expect(analyzePhone('   ').whatsappUrl).toBeNull();
  });

  test('formatos com parênteses e espaços', () => {
    expect(whatsappUrlFor('(21) 98844-1234')).toBe('https://wa.me/5521988441234');
  });
});

describe('normalizePhoneOnSave — gravação', () => {
  test('10-11 dígitos: salva com +55 na frente', () => {
    expect(normalizePhoneOnSave('21 98844-1234')).toBe('+55 21988441234');
  });

  test('já com +: preserva formatação, só limpa espaços duplos', () => {
    expect(normalizePhoneOnSave('+55  21 99123-4567')).toBe('+55 21 99123-4567');
  });

  test('PT com default 351', () => {
    expect(normalizePhoneOnSave('912 345 678', '351')).toBe('+351 912345678');
  });

  test('lixo: devolve como veio (não inventa)', () => {
    expect(normalizePhoneOnSave('123')).toBe('123');
    expect(normalizePhoneOnSave('')).toBe('');
  });
});
