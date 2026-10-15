import { useState, useEffect, useCallback } from "react";
import defaultParametrosJson from "./data/parametros_critica_bnb.json";

export interface RegraCatalogoConfig {
  id: string; // Ex: "R01", "R15"
  regra: string;
  referencia: string | number;
  statusDefault: "OK" | "ALERTA" | "BLOQUEIA" | "NÃO VERIFICÁVEL";
  confianca: "Alta" | "Média" | "Hipótese";
  fonte: string;
  comoResolver: string;
  ativa?: boolean;
}

export interface VmicUfValores {
  matrizMesticaCorte?: number;
  reprodutorMesticoAltaMesticagem?: number;
  matrizPo?: number;
  reprodutorPo?: number;
  matrizMesticaLeiteNt1?: number;
  matrizMesticaLeiteNt2?: number;
  matrizOvinaMestica?: number;
  reprodutorOvinoPo?: number;
  matrizCaprinaMestica?: number;
  reprodutorCaprinoPo?: number;
  [key: string]: number | undefined;
}

export interface PrecosVendaUfValores {
  novilhoArroba?: number;
  vacasDescarteCabeca?: number;
  novilhasCabeca?: number;
  novilhosCabeca?: number;
  garrotesCabeca?: number;
  bezerrosCabeca?: number;
  [key: string]: number | undefined;
}

export interface SuporteForrageiroMun {
  municipio: string;
  uf: string;
  chuvaMmAno?: number;
  classeKoppen?: string;
  suporteUaHa: {
    maximoSequeiroBraquiaria?: number;
    braquiariaSequeiroNt1?: number;
    braquiariaSequeiroNt2?: number;
    irrigadoNt3?: number;
    irrigadoNt4?: number;
    andropogonSequeiroNt1?: number;
    andropogonSequeiroNt2?: number;
    buffelSequeiroNt1?: number;
    [key: string]: number | undefined;
  };
}

export interface MunicipioClassifItem {
  municipio: string;
  uf?: string;
  localizacao: string; // "SEMIÁRIDO" | "FORA DO SEMIÁRIDO"
  agencia?: string;
  regiao?: string;
  vovacoes?: {
    bovinoculturaCorteCria?: {
      vocacao?: string;
      nt?: string;
    };
    bovinoculturaLeite?: {
      vocacao?: string;
      nt?: string;
    };
    caprinocultura?: {
      vocacao?: string;
      nt?: string;
    };
    ovinocultura?: {
      vocacao?: string;
      nt?: string;
    };
    [key: string]: unknown;
  };
}

export interface BaseParametrosTecnicos {
  geradoEm: string;
  versao: string;
  descricao: string;
  regrasCatalogo: RegraCatalogoConfig[];
  vmicTetosPorUf: Record<string, VmicUfValores>;
  precosReferenciaVendaModelo: Record<string, PrecosVendaUfValores>;
  parametrosZootecnicos: Record<string, Array<Record<string, unknown>>>;
  suporteForrageiroMunicipios: Record<string, SuporteForrageiroMun>;
  municipiosClassificacao: Record<string, MunicipioClassifItem>;
}

const STORAGE_KEY = "PRONAF_PARAMETROS_TECNICOS_CUSTOM_V2";

// Cache em memória para acesso síncrono rápido no engineCritica
let memoriaParametros: BaseParametrosTecnicos | null = null;
const listeners = new Set<() => void>();

function carregarDoArmazenamento(): BaseParametrosTecnicos {
  if (memoriaParametros) return memoriaParametros;

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        // Validação básica de integridade
        if (parsed.regrasCatalogo && parsed.vmicTetosPorUf) {
          memoriaParametros = {
            ...(defaultParametrosJson as unknown as BaseParametrosTecnicos),
            ...parsed,
          };
          return memoriaParametros as BaseParametrosTecnicos;
        }
      }
    }
  } catch {
    // Se houver erro de parsing ou cota de localStorage, usa default
  }

  memoriaParametros = defaultParametrosJson as unknown as BaseParametrosTecnicos;
  return memoriaParametros;
}

function notificarMudancas() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Evita travamento por listeners com erro
    }
  });
}

/**
 * Retorna os parâmetros técnicos consolidados atuais (com customizações salvas pelo usuário).
 */
export function getParametrosConsolidados(): BaseParametrosTecnicos {
  return carregarDoArmazenamento();
}

/**
 * Salva e persiste os novos parâmetros técnicos no localStorage e memória.
 */
export function salvarParametrosConsolidados(novos: BaseParametrosTecnicos): void {
  memoriaParametros = { ...novos };
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novos));
    }
  } catch (err) {
    // Tratamento caso atinja cota do localStorage
    console.warn("Não foi possível salvar tudo no localStorage (cota excedida). Mantendo em memória.");
  }
  notificarMudancas();
}

/**
 * Restaura todos os parâmetros técnicos para os valores de fábrica (oficiais do BNB).
 */
export function restaurarParametrosPadrao(): BaseParametrosTecnicos {
  const padrao = defaultParametrosJson as unknown as BaseParametrosTecnicos;
  memoriaParametros = { ...padrao };
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
  notificarMudancas();
  return memoriaParametros;
}

/**
 * Exporta o arquivo JSON com todos os parâmetros atuais para download.
 */
export function exportarParametrosParaDownload(): void {
  const dados = getParametrosConsolidados();
  const jsonStr = JSON.stringify(dados, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dataHoje = new Date().toISOString().slice(0, 10);
  a.download = `Parametros_Tecnicos_BNB_${dataHoje}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Importa um arquivo JSON de parâmetros e aplica ao sistema.
 */
export function importarParametrosDeArquivoJson(jsonStr: string): BaseParametrosTecnicos {
  const parsed = JSON.parse(jsonStr) as Partial<BaseParametrosTecnicos>;
  if (!parsed.regrasCatalogo || !parsed.vmicTetosPorUf) {
    throw new Error("Arquivo JSON de parâmetros inválido: campos obrigatórios não encontrados.");
  }

  const mesclado: BaseParametrosTecnicos = {
    ...(defaultParametrosJson as unknown as BaseParametrosTecnicos),
    ...parsed,
  };

  salvarParametrosConsolidados(mesclado);
  return mesclado;
}

/**
 * Hook do React para gerenciar e reagir às alterações nos parâmetros técnicos.
 */
export function useParametrosTecnicos() {
  const [parametros, setParametros] = useState<BaseParametrosTecnicos>(getParametrosConsolidados);

  useEffect(() => {
    const handler = () => {
      setParametros(getParametrosConsolidados());
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  // CRUD: Regras de Conformidade
  const salvarRegra = useCallback((regra: RegraCatalogoConfig) => {
    const atual = getParametrosConsolidados();
    const index = atual.regrasCatalogo.findIndex((r) => r.id === regra.id);
    let novasRegras: RegraCatalogoConfig[];

    if (index >= 0) {
      novasRegras = [...atual.regrasCatalogo];
      novasRegras[index] = { ...regra };
    } else {
      novasRegras = [...atual.regrasCatalogo, regra];
    }

    salvarParametrosConsolidados({
      ...atual,
      regrasCatalogo: novasRegras,
    });
  }, []);

  const excluirRegra = useCallback((id: string) => {
    const atual = getParametrosConsolidados();
    const novasRegras = atual.regrasCatalogo.filter((r) => r.id !== id);
    salvarParametrosConsolidados({
      ...atual,
      regrasCatalogo: novasRegras,
    });
  }, []);

  // CRUD: VMIC Tetos por UF
  const salvarVmicUf = useCallback((uf: string, valores: VmicUfValores) => {
    const atual = getParametrosConsolidados();
    salvarParametrosConsolidados({
      ...atual,
      vmicTetosPorUf: {
        ...atual.vmicTetosPorUf,
        [uf.toUpperCase()]: {
          ...atual.vmicTetosPorUf[uf.toUpperCase()],
          ...valores,
        },
      },
    });
  }, []);

  const excluirVmicUf = useCallback((uf: string) => {
    const atual = getParametrosConsolidados();
    const copia = { ...atual.vmicTetosPorUf };
    delete copia[uf.toUpperCase()];
    salvarParametrosConsolidados({
      ...atual,
      vmicTetosPorUf: copia,
    });
  }, []);

  // CRUD: Preços de Venda
  const salvarPrecosVendaUf = useCallback((uf: string, valores: PrecosVendaUfValores) => {
    const atual = getParametrosConsolidados();
    salvarParametrosConsolidados({
      ...atual,
      precosReferenciaVendaModelo: {
        ...atual.precosReferenciaVendaModelo,
        [uf.toUpperCase()]: {
          ...atual.precosReferenciaVendaModelo[uf.toUpperCase()],
          ...valores,
        },
      },
    });
  }, []);

  const excluirPrecosVendaUf = useCallback((uf: string) => {
    const atual = getParametrosConsolidados();
    const copia = { ...atual.precosReferenciaVendaModelo };
    delete copia[uf.toUpperCase()];
    salvarParametrosConsolidados({
      ...atual,
      precosReferenciaVendaModelo: copia,
    });
  }, []);

  // CRUD: Suporte Forrageiro
  const salvarSuporteForrageiro = useCallback((mun: SuporteForrageiroMun) => {
    const atual = getParametrosConsolidados();
    const chave = mun.municipio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    salvarParametrosConsolidados({
      ...atual,
      suporteForrageiroMunicipios: {
        ...atual.suporteForrageiroMunicipios,
        [chave]: mun,
      },
    });
  }, []);

  const excluirSuporteForrageiro = useCallback((chave: string) => {
    const atual = getParametrosConsolidados();
    const copia = { ...atual.suporteForrageiroMunicipios };
    delete copia[chave];
    salvarParametrosConsolidados({
      ...atual,
      suporteForrageiroMunicipios: copia,
    });
  }, []);

  // CRUD: Classificação de Município
  const salvarClassificacaoMunicipio = useCallback((item: MunicipioClassifItem) => {
    const atual = getParametrosConsolidados();
    const chave = item.municipio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    salvarParametrosConsolidados({
      ...atual,
      municipiosClassificacao: {
        ...atual.municipiosClassificacao,
        [chave]: item,
      },
    });
  }, []);

  const excluirClassificacaoMunicipio = useCallback((chave: string) => {
    const atual = getParametrosConsolidados();
    const copia = { ...atual.municipiosClassificacao };
    delete copia[chave];
    salvarParametrosConsolidados({
      ...atual,
      municipiosClassificacao: copia,
    });
  }, []);

  return {
    parametros,
    salvarRegra,
    excluirRegra,
    salvarVmicUf,
    excluirVmicUf,
    salvarPrecosVendaUf,
    excluirPrecosVendaUf,
    salvarSuporteForrageiro,
    excluirSuporteForrageiro,
    salvarClassificacaoMunicipio,
    excluirClassificacaoMunicipio,
    restaurarPadroes: restaurarParametrosPadrao,
    exportarJson: exportarParametrosParaDownload,
    importarJson: importarParametrosDeArquivoJson,
  };
}
