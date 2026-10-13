import { createXlsmReader } from "./exportXlsm";
import { cellsToProjeto } from "./cellMapping";
import type { ProjetoA2 } from "./types";

/**
 * Importa um .xlsm já preenchido (spec §9): lê os valores em cache das mesmas
 * células de entrada usadas na exportação e reconstrói o projeto.
 * Tudo acontece no navegador; nada é enviado à rede.
 */
export async function importXlsm(file: Blob | ArrayBuffer): Promise<ProjetoA2> {
  const read = await createXlsmReader(file);
  return cellsToProjeto(read);
}
