import { validateCPF } from "./cpf";
import { validateCNPJ } from "./cnpj";

/**
 * Valida CPF ou CNPJ (usado em "CPF/CNPJ do Proprietário", sócios etc.).
 * Equivale a `IF(Verifica_CPF(x),1,IF(Verifica_CGC(x),1,-1))` da planilha.
 */
export function validateCPFouCNPJ(val: string): boolean {
  if (!val) return false;
  const clean = val.replace(/[.\-/\s]/g, "").trim();
  if (/^\d{1,11}$/.test(clean) && validateCPF(clean)) return true;
  return validateCNPJ(clean);
}
