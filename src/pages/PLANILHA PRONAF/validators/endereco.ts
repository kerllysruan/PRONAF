/**
 * Nº do endereço: número inteiro ou "S/N".
 * Planilha: IF(OR(UPPER(TRIM(E46))="S/N",ISNUMBER(E46)),1,-1)
 */
export function validateNumeroEndereco(val: string): boolean {
  if (!val) return false;
  const trimmed = String(val).trim();
  if (trimmed.toUpperCase() === "S/N") return true;
  return /^\d+$/.test(trimmed);
}

/**
 * CEP: inteiro até 99.999.999 ("CEP inconsistente").
 * Validação de dados da planilha: whole, ≤ 99999999.
 */
export function validateCEP(val: string): boolean {
  if (val === undefined || val === null) return false;
  const clean = String(val).replace(/[.\-\s]/g, "");
  if (!/^\d{1,8}$/.test(clean)) return false;
  return Number(clean) <= 99999999;
}

/** DDD: inteiro 1–9999 ("Somente caracteres numéricos permitir até 04 caracteres.") */
export function validateDDD(val: string): boolean {
  const s = String(val ?? "").trim();
  if (!/^\d{1,4}$/.test(s)) return false;
  const n = Number(s);
  return n >= 1 && n <= 9999;
}

/** Telefone: inteiro 0–999999999 ("Somente caracteres numéricos permitir até 09 caracteres.") */
export function validateTelefone(val: string): boolean {
  const s = String(val ?? "").trim();
  if (!/^\d{1,9}$/.test(s)) return false;
  return Number(s) <= 999999999;
}
