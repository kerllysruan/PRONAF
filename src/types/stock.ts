export interface StockProposal {
  id: string;
  producer_name: string;
  producer_cpf: string | null;
  credit_program: string | null;
  estimated_value: number | null;
  notes: string | null;
  agency_id: string;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  // CSV import fields
  pendencias: string | null;
  serasa: string | null;
  cliente_renovacao: string | null;
  ano_contrato: string | null;
  agencia_cadastro: string | null;
  municipio: string | null;
  linha_credito: string | null;
  localizacao: string | null;
  observacoes_extra: string | null;
  original_csv_status: string | null;
  order_index: number;
}

export type InsertStockProposal = Omit<StockProposal, 'id' | 'created_at' | 'updated_at' | 'agency_id' | 'created_by'>;
export type UpdateStockProposal = Partial<InsertStockProposal>;
