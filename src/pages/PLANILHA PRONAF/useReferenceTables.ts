import { useState, useEffect } from "react";

export interface ReferenceItem {
  code?: string;
  description: string;
}

export interface UseReferenceTablesResult {
  getList(listName: string): ReferenceItem[]; // e.g. getList('visaoDOC')
  getListStrings(listName: string): string[]; // just the description strings
  loaded: boolean;
}

interface TableRow {
  linha: number;
  [col: string]: string | number | null | undefined;
}

interface ReferenceTable {
  sheet: string;
  colunas: string;
  linha_cabecalho: number;
  titulo_grupo?: (string | null)[];
  cabecalho: string[];
  n_linhas: number;
  linhas: TableRow[];
}

interface NamedRange {
  name: string;
  local: string | null;
  hidden: boolean;
  ref: string;
}

// Module-level caches so data is loaded and parsed only once across all components
let loadPromise: Promise<void> | null = null;
let isLoaded = false;
let referenceTablesCache: Record<string, ReferenceTable> | null = null;
let namedRangesCache: NamedRange[] | null = null;
const listCache = new Map<string, ReferenceItem[]>();

/**
 * Converte letra de coluna do Excel (ex: 'A', 'Z', 'AA', 'GA') para índice baseado em 1
 */
function colToIndex(col: string): number {
  const upper = col.toUpperCase();
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index;
}

/**
 * Verifica se uma coluna está dentro de um intervalo de colunas (ex: 'C' em 'C:F' ou 'GA' em 'GA')
 */
function isColInRange(col: string, colRange: string): boolean {
  if (!col || !colRange) return false;
  const parts = colRange.split(":");
  const c = colToIndex(col);
  if (parts.length === 1) {
    return colToIndex(parts[0]) === c;
  }
  const start = colToIndex(parts[0]);
  const end = colToIndex(parts[1]);
  return c >= Math.min(start, end) && c <= Math.max(start, end);
}

/**
 * Dispara o carregamento dinâmico e armazena os módulos
 */
async function loadReferenceData(): Promise<void> {
  if (isLoaded) return;

  const [tablesModule, rangesModule] = await Promise.all([
    import("./data/reference_tables.json"),
    import("./data/named_ranges.json"),
  ]);

  referenceTablesCache = (tablesModule.default || tablesModule) as Record<string, ReferenceTable>;
  namedRangesCache = (rangesModule.default || rangesModule) as NamedRange[];
  isLoaded = true;
}

/**
 * Extrai lista de itens a partir dos dados carregados
 */
function resolveList(listName: string): ReferenceItem[] {
  if (!listName || typeof listName !== "string") return [];

  const trimmed = listName.trim();
  const normalizedKey = trimmed.toLowerCase();

  // Verifica cache
  if (listCache.has(normalizedKey)) {
    return listCache.get(normalizedKey)!;
  }

  // 1. Literal list (ex: "Masculino,Feminino", '"Sim,Não"')
  const cleanLiteral = trimmed.replace(/^["']|["']$/g, "").trim();
  if (cleanLiteral.includes(",")) {
    const items: ReferenceItem[] = cleanLiteral
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((description) => ({
        description,
        code: description,
      }));

    listCache.set(normalizedKey, items);
    return items;
  }

  if (!isLoaded || !referenceTablesCache || !namedRangesCache) {
    return [];
  }

  // 2. Busca pelo named_ranges.json
  const namedRange = namedRangesCache.find(
    (nr) => nr.name.toLowerCase() === normalizedKey
  );

  if (namedRange) {
    const ref = namedRange.ref || "";
    let startCol = "";
    let endCol: string | undefined;
    let startRow: number | undefined;
    let endRow: number | undefined;

    // Padrão A: OFFSET(VISAO!$J$12,0,0,COUNTA(...),1)
    const offsetMatch = ref.match(/OFFSET\((?:'[^']+'|VISAO)!\$([A-Z]+)\$(\d+)/i);
    if (offsetMatch) {
      startCol = offsetMatch[1].toUpperCase();
      startRow = parseInt(offsetMatch[2], 10);
    } else {
      // Padrão B: VISAO!$W$12:$W$28 ou VISAO!$W$12:$X$28
      const rangeMatch = ref.match(
        /(?:'[^']+'|VISAO)!\$([A-Z]+)\$(\d+)(?::\$([A-Z]+)\$(\d+))?/i
      );
      if (rangeMatch) {
        startCol = rangeMatch[1].toUpperCase();
        startRow = parseInt(rangeMatch[2], 10);
        endCol = rangeMatch[3] ? rangeMatch[3].toUpperCase() : startCol;
        endRow = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : startRow;
      }
    }

    if (startCol) {
      // Procura se existe uma faixa _COD correspondente para identificar a coluna de código
      let codeCol: string | undefined;
      if (endCol && endCol !== startCol) {
        codeCol = endCol;
      } else {
        const codRangeName = `${namedRange.name}_COD`.toLowerCase();
        const codRangeDescr = namedRange.name.toLowerCase().endsWith("_descr")
          ? namedRange.name.replace(/_descr$/i, "_COD").toLowerCase()
          : null;

        const codRange = namedRangesCache.find(
          (nr) =>
            nr.name.toLowerCase() === codRangeName ||
            (codRangeDescr && nr.name.toLowerCase() === codRangeDescr)
        );

        if (codRange) {
          const codMatch = codRange.ref.match(
            /(?:'[^']+'|VISAO)!\$[A-Z]+\$\d+:\$([A-Z]+)\$\d+/i
          );
          if (codMatch) {
            codeCol = codMatch[1].toUpperCase();
          }
        }
      }

      // Localiza a tabela no reference_tables.json cuja propriedade colunas cobre startCol
      let targetTable: ReferenceTable | null = null;
      for (const table of Object.values(referenceTablesCache)) {
        if (isColInRange(startCol, table.colunas)) {
          targetTable = table;
          break;
        }
      }

      if (targetTable && Array.isArray(targetTable.linhas)) {
        const items: ReferenceItem[] = [];
        const seenDescriptions = new Set<string>();

        for (const row of targetTable.linhas) {
          if (startRow !== undefined && row.linha < startRow) continue;
          if (endRow !== undefined && row.linha > endRow) continue;

          const descRaw = row[startCol];
          if (descRaw === undefined || descRaw === null) continue;
          const description = String(descRaw).trim();
          if (!description || seenDescriptions.has(description)) continue;

          seenDescriptions.add(description);

          let code: string | undefined;
          if (codeCol && row[codeCol] !== undefined && row[codeCol] !== null) {
            code = String(row[codeCol]).trim();
          }

          items.push({
            description,
            ...(code !== undefined ? { code } : {}),
          });
        }

        listCache.set(normalizedKey, items);
        return items;
      }
    }
  }

  // 3. Busca direta por nome de tabela em reference_tables.json
  const directTable =
    referenceTablesCache[normalizedKey] ||
    referenceTablesCache[trimmed] ||
    Object.entries(referenceTablesCache).find(
      ([key]) => key.toLowerCase() === normalizedKey
    )?.[1];

  if (directTable && Array.isArray(directTable.linhas)) {
    const items: ReferenceItem[] = [];
    const cols = directTable.colunas.split(":");
    const mainCol = cols[0];
    const secondCol = cols.length > 1 ? cols[1] : undefined;

    for (const row of directTable.linhas) {
      const descRaw = row[mainCol];
      if (descRaw === undefined || descRaw === null) continue;
      const description = String(descRaw).trim();
      if (!description) continue;

      let code: string | undefined;
      if (secondCol && row[secondCol] !== undefined && row[secondCol] !== null) {
        code = String(row[secondCol]).trim();
      }

      items.push({
        description,
        ...(code !== undefined ? { code } : {}),
      });
    }

    listCache.set(normalizedKey, items);
    return items;
  }

  // Se não encontrar nada, armazena vazio
  listCache.set(normalizedKey, []);
  return [];
}

/**
 * Hook do React para carregamento sob demanda das tabelas de referência e listas suspensas
 */
export function useReferenceTables(): UseReferenceTablesResult {
  const [loaded, setLoaded] = useState(isLoaded);

  useEffect(() => {
    if (isLoaded) {
      setLoaded(true);
      return;
    }

    if (!loadPromise) {
      loadPromise = loadReferenceData();
    }

    loadPromise
      .then(() => {
        setLoaded(true);
      })
      .catch((err) => {
        // Falha no carregamento
        console.error("Erro ao carregar tabelas de referência:", err);
      });
  }, []);

  const getList = (listName: string): ReferenceItem[] => {
    if (!loaded && !isLoaded) {
      // Se for uma lista literal, já pode resolver mesmo antes do json
      const clean = listName ? listName.trim().replace(/^["']|["']$/g, "") : "";
      if (clean.includes(",")) {
        return resolveList(listName);
      }
      return [];
    }
    return resolveList(listName);
  };

  const getListStrings = (listName: string): string[] => {
    return getList(listName).map((item) => item.description);
  };

  return {
    getList,
    getListStrings,
    loaded,
  };
}
