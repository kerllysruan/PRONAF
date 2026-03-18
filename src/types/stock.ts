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
}

export type InsertStockProposal = Omit<StockProposal, 'id' | 'created_at' | 'updated_at' | 'agency_id' | 'created_by'>;
export type UpdateStockProposal = Partial<InsertStockProposal>;
