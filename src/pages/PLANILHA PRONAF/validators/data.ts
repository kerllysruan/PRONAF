/**
 * Validador e utilitário de datas no padrão brasileiro (dd/mm/aaaa)
 * e conversão para número serial do Excel (base 1900).
 */

/**
 * Converte uma string de data no formato dd/mm/aaaa para um objeto Date.
 * Retorna null caso a data seja inválida ou o formato esteja incorreto.
 *
 * @param value String no formato dd/mm/aaaa
 * @returns Instância de Date ou null se inválida
 */
export function parseDate(value: string): Date | null {
  if (!value || typeof value !== 'string') return null;

  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;

  // Dias máximos por mês considerando anos bissextos
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;

  const date = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Verificação de consistência para evitar rollover do Date
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Valida se uma string é uma data válida no formato dd/mm/aaaa e não é futura (hoje ou passado).
 *
 * @param value Data no formato dd/mm/aaaa
 * @returns true se a data for válida e não for futura
 */
export function validateDate(value: string): boolean {
  return validateDateNotFuture(value);
}

/**
 * Valida se a data não se encontra no futuro (data informada <= hoje).
 *
 * @param value Data no formato dd/mm/aaaa
 * @returns true se a data for válida e menor ou igual a hoje
 */
export function validateDateNotFuture(value: string): boolean {
  const parsed = parseDate(value);
  if (!parsed) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  return parsed.getTime() <= today.getTime();
}

/**
 * Valida se a primeira data é maior ou igual à segunda data (value >= after).
 * Útil para: Data de Emissão >= Data de Nascimento, cronogramas de desembolso, etc.
 *
 * @param value Data a ser verificada (dd/mm/aaaa)
 * @param after Data de referência mínima (dd/mm/aaaa)
 * @returns true se value >= after e ambas forem datas válidas
 */
export function validateDateAfter(value: string, after: string): boolean {
  const dValue = parseDate(value);
  const dAfter = parseDate(after);

  if (!dValue || !dAfter) return false;

  return dValue.getTime() >= dAfter.getTime();
}

/**
 * Converte uma data no formato dd/mm/aaaa para o número serial de data do Excel (base 1900).
 *
 * Regra do Excel 1900:
 * - 01/01/1900 tem número serial 1.
 * - Inclui o bug histórico do Lotus 1-2-3 (dia fictício 29/02/1900 = serial 60).
 * - Para qualquer data a partir de 01/03/1900, o serial é o número de dias desde 30/12/1899.
 *
 * @param dateStr Data no formato dd/mm/aaaa
 * @returns Número serial do Excel (ex.: 01/01/2026 -> 46023) ou 0 se inválido
 */
export function excelSerialDate(dateStr: string): number {
  const date = parseDate(dateStr);
  if (!date) return 0;

  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Para datas antes de março de 1900
  if (year === 1900 && month < 2) {
    const epoch1900 = Date.UTC(1899, 11, 31);
    const targetUTC = Date.UTC(year, month, day);
    return Math.round((targetUTC - epoch1900) / 86400000);
  }

  // Base padrão do Excel (30 de dezembro de 1899 em UTC)
  const excelEpoch = Date.UTC(1899, 11, 30);
  const targetUTC = Date.UTC(year, month, day);

  return Math.round((targetUTC - excelEpoch) / 86400000);
}

/**
 * Converte um número serial do Excel de volta para string no formato dd/mm/aaaa.
 *
 * @param serial Número serial do Excel
 * @returns Data formatada dd/mm/aaaa ou vazio se inválido
 */
export function excelSerialToDateStr(serial: number): string {
  if (!serial || serial <= 0) return '';

  // Ajuste do bug do Lotus 1-2-3 (29/02/1900)
  const adjustedSerial = serial > 60 ? serial - 1 : serial;
  const epoch = Date.UTC(1899, 11, 31);
  const ms = epoch + adjustedSerial * 86400000;
  const date = new Date(ms);

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formata um objeto Date para dd/mm/aaaa.
 *
 * @param date Instância de Date
 * @returns String formatada dd/mm/aaaa
 */
export function formatDateBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Converte data no formato dd/mm/aaaa (ou já aaaa-mm-dd) para formato do input HTML type="date" (aaaa-mm-dd).
 */
export function toInputDate(value?: string | null): string {
  if (!value) return '';
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }
  return '';
}

/**
 * Converte valor vindo de input HTML type="date" (aaaa-mm-dd) para dd/mm/aaaa.
 */
export function fromInputDate(value?: string | null): string {
  if (!value) return '';
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const y = m[1];
    const mo = m[2].padStart(2, '0');
    const d = m[3].padStart(2, '0');
    return `${d}/${mo}/${y}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;
  return s;
}
