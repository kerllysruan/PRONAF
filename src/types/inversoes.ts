export interface InversaoReferencia {
  id: string;
  codigo?: string | null;
  categoria: string;
  subcategoria?: string | null;
  item: string;
  nome_completo: string;
  grupo: string;
  unidade_padrao: string;
  valor_maximo: number;
  valor_minimo?: number | null;
  precos_por_uf?: Record<string, number> | null;
  ordem?: number | null;
}

export interface InversaoItem {
  quant: number;
  unid: string;
  nome: string;
  valor_unitario: number;
  valor: number; // Valor Total
  item_referencia_id?: string | null;
  teto_maximo?: number | null;
}

export interface ValidacaoInversaoResult {
  valido: boolean;
  tetoMaximo: number;
  excessoUnitario: number;
  excessoTotal: number;
  valorMaximoTotal: number;
  mensagem?: string;
}
