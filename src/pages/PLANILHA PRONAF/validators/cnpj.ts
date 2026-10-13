/**
 * Validador e formatador de CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * Suporta CNPJ numérico tradicional e CNPJ alfanumérico (conforme IN RFB 2.229/2024 e VBA CNPJFormatar.bas).
 */

/**
 * Remove qualquer caractere especial e retorna apenas letras e números em maiúsculas,
 * preenchendo à esquerda com zeros até 14 posições.
 *
 * @param value Valor bruto informado
 * @returns CNPJ limpo com 14 caracteres alfanuméricos ou vazio se não houver caracteres válidos
 */
export function cleanCNPJ(value: string): string {
  if (!value) return '';
  const cleaned = value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  if (cleaned.length === 0) return '';
  return cleaned.padStart(14, '0').slice(-14);
}

/**
 * Converte um caractere alfanumérico no seu respectivo valor numérico para cálculo de DV
 * conforme regra da Receita Federal e VBA (Asc(ch) - 48).
 *
 * Exemplos:
 * '0'..'9' -> 0..9
 * 'A' -> 17
 * 'B' -> 18
 * ...
 * 'Z' -> 42
 *
 * @param ch Caractere alfanumérico
 * @returns Valor inteiro correspondente
 */
export function valorCaractereCNPJ(ch: string): number {
  return ch.toUpperCase().charCodeAt(0) - 48;
}

/**
 * Calcula o dígito verificador módulo 11 para CNPJ (numérico ou alfanumérico)
 * com base no array de pesos informado.
 *
 * @param base Cadeia de caracteres a ser multiplicada pelos pesos
 * @param pesos Pesos correspondentes para cada posição
 * @returns Dígito verificador calculado (0 a 9)
 */
export function calculaDVCnpjModulo11(base: string, pesos: readonly number[]): number {
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    soma += valorCaractereCNPJ(base.charAt(i)) * pesos[i];
  }

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Verifica se um CNPJ possui caracteres alfabéticos na raiz/base (CNPJ alfanumérico).
 *
 * @param value Valor do CNPJ
 * @returns true se possuir letras na base
 */
export function isCNPJAlfanumerico(value: string): boolean {
  const cnpj = cleanCNPJ(value);
  if (cnpj.length !== 14) return false;
  return /[A-Z]/.test(cnpj.slice(0, 12));
}

/** Pesos para cálculo do 1º dígito verificador do CNPJ */
const PESOS_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

/** Pesos para cálculo do 2º dígito verificador do CNPJ */
const PESOS_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

/** Sequências numéricas inválidas conhecidas */
const CNPJS_NUMERICOS_INVALIDOS = [
  '00000000000000',
  '11111111111111',
  '22222222222222',
  '33333333333333',
  '44444444444444',
  '55555555555555',
  '66666666666666',
  '77777777777777',
  '88888888888888',
  '99999999999999'
];

/**
 * Valida um CNPJ (numérico ou alfanumérico).
 *
 * Regras:
 * - Deve conter 14 posições (completadas com zeros à esquerda se fornecido com menos dígitos)
 * - Base de 12 posições (letras [A-Z] e/ou números [0-9])
 * - Os 2 últimos caracteres (DVs) devem ser obrigatoriamente numéricos [0-9]
 * - Se for estritamente numérico, rejeita sequências com todos os dígitos iguais
 * - Valida ambos os dígitos verificadores pelo algoritmo de módulo 11
 *
 * @param value Valor do CNPJ (com ou sem máscara)
 * @returns true se o CNPJ for válido, false caso contrário
 */
export function validateCNPJ(value: string): boolean {
  if (!value) return false;

  const rawClean = value.replace(/[^0-9A-Za-z]/g, '');
  if (rawClean.length === 0 || rawClean.length > 14) {
    return false;
  }

  const cnpj = cleanCNPJ(value);
  if (cnpj.length !== 14) {
    return false;
  }

  // Os dois últimos caracteres (DVs) devem ser obrigatoriamente numéricos
  const dvInformado = cnpj.slice(12, 14);
  if (!/^\d{2}$/.test(dvInformado)) {
    return false;
  }

  // Se for puramente numérico, rejeita sequências repetidas
  if (/^\d{14}$/.test(cnpj) && CNPJS_NUMERICOS_INVALIDOS.includes(cnpj)) {
    return false;
  }

  const base12 = cnpj.slice(0, 12);

  // Apenas caracteres alfanuméricos válidos são permitidos na base
  if (!/^[0-9A-Z]{12}$/.test(base12)) {
    return false;
  }

  // Cálculo do 1º DV
  const dv1 = calculaDVCnpjModulo11(base12, PESOS_CNPJ_1);

  // Cálculo do 2º DV (base12 concatenada com dv1)
  const dv2 = calculaDVCnpjModulo11(base12 + dv1.toString(), PESOS_CNPJ_2);

  return dvInformado === `${dv1}${dv2}`;
}

/**
 * Formata um CNPJ no padrão tradicional: 00.000.000/0000-00 (suporta alfanumérico: XX.XXX.XXX/XXXX-XX).
 *
 * @param value Valor do CNPJ com ou sem máscara
 * @returns CNPJ formatado no padrão 00.000.000/0000-00
 */
export function formatCNPJ(value: string): string {
  const cnpj = cleanCNPJ(value);
  if (cnpj.length !== 14) {
    return value || '';
  }

  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
}

/**
 * Formata um CNPJ no padrão de integração da planilha: 000000000000-00.
 *
 * @param value Valor do CNPJ com ou sem máscara
 * @returns CNPJ formatado no padrão 000000000000-00
 */
export function formatCNPJIntegration(value: string): string {
  const cnpj = cleanCNPJ(value);
  if (cnpj.length !== 14) {
    return value || '';
  }

  return `${cnpj.slice(0, 12)}-${cnpj.slice(12, 14)}`;
}
