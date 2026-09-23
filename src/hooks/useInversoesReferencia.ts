import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InversaoReferencia, InversaoItem, ValidacaoInversaoResult } from "@/types/inversoes";

let cachedInversoes: InversaoReferencia[] | null = null;
let pendingPromise: Promise<InversaoReferencia[]> | null = null;

export function useInversoesReferencia() {
  const [inversoes, setInversoes] = useState<InversaoReferencia[]>(cachedInversoes || []);
  const [loading, setLoading] = useState<boolean>(!cachedInversoes);

  useEffect(() => {
    if (cachedInversoes) {
      setInversoes(cachedInversoes);
      setLoading(false);
      return;
    }

    if (!pendingPromise) {
      pendingPromise = (async () => {
        try {
          const { data, error } = await supabase
            .from("inversoes_referencia" as any)
            .select("*")
            .order("ordem", { ascending: true });

          if (error) {
            console.error("Erro ao carregar inversões de referência:", error);
            return [];
          }

          const parsed = (data || []).map((row: any) => ({
            id: row.id,
            codigo: row.codigo,
            categoria: row.categoria,
            subcategoria: row.subcategoria,
            item: row.item,
            nome_completo: row.nome_completo,
            grupo: row.grupo,
            unidade_padrao: row.unidade_padrao || "UNID",
            valor_maximo: Number(row.valor_maximo) || 0,
            valor_minimo: row.valor_minimo != null ? Number(row.valor_minimo) : null,
            precos_por_uf: row.precos_por_uf || {},
            ordem: row.ordem,
          }));

          cachedInversoes = parsed;
          return parsed;
        } catch (e) {
          console.error("Erro inesperado ao buscar inversões de referência:", e);
          return [];
        } finally {
          pendingPromise = null;
        }
      })();
    }

    pendingPromise.then((items) => {
      setInversoes(items);
      setLoading(false);
    });
  }, []);

  // Categorias únicas
  const categorias = useMemo(() => {
    const set = new Set<string>();
    inversoes.forEach((inv) => set.add(inv.categoria));
    return Array.from(set);
  }, [inversoes]);

  // Itens agrupados por categoria
  const agrupadoPorCategoria = useMemo(() => {
    const map: Record<string, InversaoReferencia[]> = {};
    inversoes.forEach((inv) => {
      if (!map[inv.categoria]) map[inv.categoria] = [];
      map[inv.categoria].push(inv);
    });
    return map;
  }, [inversoes]);

  // Encontra uma inversão pelo id ou pelo nome
  const findReferencia = useCallback(
    (nomeOuId: string): InversaoReferencia | null => {
      if (!nomeOuId || !inversoes.length) return null;
      const clean = nomeOuId.trim().toUpperCase();

      // 1. Busca por ID direto
      const byId = inversoes.find((i) => i.id === nomeOuId);
      if (byId) return byId;

      // 2. Busca exata por nome completo
      const exact = inversoes.find(
        (i) =>
          i.nome_completo.toUpperCase() === clean ||
          i.item.toUpperCase() === clean
      );
      if (exact) return exact;

      // 3. Busca por inclusão de texto
      const partial = inversoes.find(
        (i) =>
          i.nome_completo.toUpperCase().includes(clean) ||
          clean.includes(i.item.toUpperCase())
      );
      if (partial) return partial;

      // 4. Busca por similaridade de palavras-chave / tokens
      const norm = (s: string) =>
        s
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .replace(/[^A-Z0-9\s]/g, " ");

      const stopWords = new Set(["AQUISICAO", "IMPLANTACAO", "REFORMA", "PARA", "COM", "DOS", "DAS", "UMA", "UNID"]);
      const qWords = norm(clean)
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));

      if (qWords.length > 0) {
        let bestMatch: InversaoReferencia | null = null;
        let bestScore = 0;

        for (const inv of inversoes) {
          const target = norm(inv.nome_completo);
          let score = 0;
          for (const w of qWords) {
            if (target.includes(w)) {
              score += 3;
            } else if (w.length > 4 && (w.endsWith("AS") || w.endsWith("OS"))) {
              if (target.includes(w.slice(0, -2))) score += 2;
            } else if (w.length > 3 && w.endsWith("S")) {
              if (target.includes(w.slice(0, -1))) score += 2;
            }
          }
          if (score > bestScore) {
            bestScore = score;
            bestMatch = inv;
          }
        }

        if (bestScore >= 3 && bestMatch) {
          return bestMatch;
        }
      }

      return null;
    },
    [inversoes]
  );

  /**
   * Valida se uma inversão está dentro do teto máximo permitido
   */
  const validarInversao = useCallback(
    (item: InversaoItem, uf?: string): ValidacaoInversaoResult => {
      const ref = findReferencia(item.item_referencia_id || item.nome);
      if (!ref) {
        return {
          valido: true,
          tetoMaximo: 0,
          excessoUnitario: 0,
          excessoTotal: 0,
          valorMaximoTotal: 0,
        };
      }

      // Se houver UF especificada e tiver preço regional
      let teto = ref.valor_maximo;
      if (uf && ref.precos_por_uf) {
        const ufKey = uf.trim().toUpperCase();
        if (ref.precos_por_uf[ufKey]) {
          teto = ref.precos_por_uf[ufKey];
        }
      }

      const quant = Math.max(1, item.quant || 1);
      // Valor unitário informado ou derivado do valor total
      const valorUnitario = item.valor_unitario > 0 ? item.valor_unitario : (item.valor || 0) / quant;
      const valorMaximoTotal = quant * teto;
      const valorTotal = item.valor || (quant * valorUnitario);

      // Tolerância de 1 centavo para arredondamento
      const excessoUnitario = Math.max(0, valorUnitario - teto);
      const excessoTotal = Math.max(0, valorTotal - valorMaximoTotal);
      const valido = excessoUnitario < 0.01;

      return {
        valido,
        tetoMaximo: teto,
        excessoUnitario,
        excessoTotal,
        valorMaximoTotal,
        mensagem: !valido
          ? `O valor unitário de R$ ${valorUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ultrapassa o teto máximo permitido de R$ ${teto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} para este item.`
          : undefined,
      };
    },
    [findReferencia]
  );

  return {
    inversoes,
    loading,
    categorias,
    agrupadoPorCategoria,
    findReferencia,
    validarInversao,
  };
}
