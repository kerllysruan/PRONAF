import { describe, it, expect } from 'vitest';
import {
  identificarParametrosPorPrograma,
  validarParametrosCalculo,
  PROGRAMAS_CREDITO_PADRAO,
} from '../programasCredito';

describe('programasCredito - Identificação e validação automática', () => {
  it('identifica corretamente os parâmetros para Res. 5.183-24 (699)', () => {
    const res = identificarParametrosPorPrograma('FNE/PRONAF GRUPO "A" -  Res. 5.183-24 (699)');
    expect(res.prazoMeses).toBe(120);
    expect(res.carenciaMeses).toBe(36);
    expect(res.jurosPercentAa).toBe(0.5);
    expect(res.periodicidadeReembolso).toBe('Anual');
    expect(res.amortizacoesIguais).toBe('Sim');
  });

  it('identifica por código numérico entre parênteses (368)', () => {
    const res = identificarParametrosPorPrograma('FNE/PRONAF GRUPO "A" - FNE (368)');
    expect(res.prazoMeses).toBe(120);
    expect(res.carenciaMeses).toBe(36);
    expect(res.jurosPercentAa).toBe(0.5);
    expect(res.codigo).toBe(368);
  });

  it('identifica por código de cooperativas (980)', () => {
    const res = identificarParametrosPorPrograma('FNE/PRONAF-A - COOPERATIVAS (980)');
    expect(res.prazoMeses).toBe(96);
    expect(res.carenciaMeses).toBe(24);
    expect(res.jurosPercentAa).toBe(3.0);
  });

  it('aplica fallback seguro para PRONAF A quando não especificado', () => {
    const res = identificarParametrosPorPrograma('');
    expect(res.prazoMeses).toBe(120);
    expect(res.carenciaMeses).toBe(36);
    expect(res.jurosPercentAa).toBe(0.5);
  });

  it('valida prazo e carência em conformidade com as regras do Excel', () => {
    const vValido = validarParametrosCalculo(120, 36, 'FNE/PRONAF GRUPO "A" - FNE (368)');
    expect(vValido.valido).toBe(true);
    expect(vValido.erros.length).toBe(0);

    const vInvalidoPrazo = validarParametrosCalculo(144, 36, 'FNE/PRONAF GRUPO "A" - FNE (368)');
    expect(vInvalidoPrazo.valido).toBe(false);
    expect(vInvalidoPrazo.erros.some((e) => e.includes('Prazo incompatível'))).toBe(true);

    const vInvalidoCarencia = validarParametrosCalculo(120, 48, 'FNE/PRONAF GRUPO "A" - FNE (368)');
    expect(vInvalidoCarencia.valido).toBe(false);
    expect(vInvalidoCarencia.erros.some((e) => e.includes('Carência incompatível'))).toBe(true);
  });
});
