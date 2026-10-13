/**
 * Validador e formatador de CPF (Cadastro de Pessoas Físicas)
 * Portado fielmente das rotinas do VBA (mdlCritica.bas e CNPJFormatar.bas).
 */

/**
 * Remove qualquer caractere não numérico e preenche à esquerda com zeros até 11 dígitos.
 * Se o valor for vazio, retorna uma string vazia.
 *
 * @param value Valor bruto informado
 * @returns CPF limpo com 11 dígitos numéricos ou vazio se não houver dígitos
 */
export function cleanCPF(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  return digits.padStart(11, '0').slice(-11);
}

/**
 * Valida se um CPF é válido de acordo com o algoritmo de módulo 11 da Receita Federal.
 *
 * Regras:
 * - Deve conter até 11 dígitos numéricos (completados com zeros à esquerda)
 * - Rejeita sequências com todos os dígitos repetidos (ex.: 00000000000, 11111111111, etc.)
 * - Valida o primeiro dígito verificador com pesos 10 a 2
 * - Valida o segundo dígito verificador com pesos 11 a 2
 *
 * @param value Valor do CPF (com ou sem máscara)
 * @returns true se o CPF for válido, false caso contrário
 */
export function validateCPF(value: string): boolean {
  if (!value) return false;

  const rawDigits = value.replace(/\D/g, '');
  // No VBA: If Len(CPF) > 11 Then Verifica_CPF = False: Exit Function
  if (rawDigits.length === 0 || rawDigits.length > 11) {
    return false;
  }

  const cpf = cleanCPF(value);
  if (cpf.length !== 11) {
    return false;
  }

  // Rejeita CPFs com todos os dígitos repetidos
  const invalidos = [
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999'
  ];

  if (invalidos.includes(cpf)) {
    return false;
  }

  // Cálculo do 1º Dígito Verificador (pesos de 10 a 2)
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i), 10) * (10 - i);
  }

  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  if (resto !== parseInt(cpf.charAt(9), 10)) {
    return false;
  }

  // Cálculo do 2º Dígito Verificador (pesos de 11 a 2)
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i), 10) * (11 - i);
  }

  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  if (resto !== parseInt(cpf.charAt(10), 10)) {
    return false;
  }

  return true;
}

/**
 * Formata um CPF no padrão tradicional brasileiro: 000.000.000-00.
 *
 * @param value Valor do CPF com ou sem máscara
 * @returns CPF formatado no padrão 000.000.000-00
 */
export function formatCPF(value: string): string {
  const cpf = cleanCPF(value);
  if (cpf.length !== 11) {
    return value || '';
  }

  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
}

/**
 * Formata um CPF no padrão de integração da planilha (sem pontos): 000000000-00.
 *
 * @param value Valor do CPF com ou sem máscara
 * @returns CPF formatado no padrão 000000000-00
 */
export function formatCPFIntegration(value: string): string {
  const cpf = cleanCPF(value);
  if (cpf.length !== 11) {
    return value || '';
  }

  return `${cpf.slice(0, 9)}-${cpf.slice(9, 11)}`;
}
