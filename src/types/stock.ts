export interface StockProposal {
  id: string;
  producer_name: string;
  producer_cpf: string | null;
  municipio: string | null;
  projetista: string | null;
  credit_program: string | null;
  linha_credito: string | null;
  estimated_value: number | null;
  localizacao: string | null;
  status: string;
  agency_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  order_index: number;
  original_csv_status?: string | null;
  notes?: string | null;
  pendencias?: string | null;
  serasa?: string | null;
}

export type InsertStockProposal = Omit<StockProposal, 'id' | 'created_at' | 'updated_at' | 'agency_id' | 'created_by'>;
export type UpdateStockProposal = Partial<InsertStockProposal>;
