import { Proposal, REQUIRED_DOCUMENTS } from '@/types/proposal';

function createDocuments(completedCount: number) {
  return REQUIRED_DOCUMENTS.map((name, i) => ({
    id: `doc-${i}`,
    name,
    completed: i < completedCount,
  }));
}

export const mockProposals: Proposal[] = [
  {
    id: '1',
    producer: { name: 'José da Silva', cpf: '123.456.789-00', address: 'Fazenda Boa Vista, Zona Rural' },
    pronafLine: 'custeio',
    requestedValue: 45000,
    status: 'aprovada',
    entryDate: '2025-11-15',
    notes: 'Proposta de custeio para safra de milho.',
    documents: createDocuments(10),
  },
  {
    id: '2',
    producer: { name: 'Maria Oliveira', cpf: '987.654.321-00', address: 'Sítio São João, Estrada Municipal' },
    pronafLine: 'investimento',
    requestedValue: 120000,
    status: 'em_analise',
    entryDate: '2025-12-03',
    notes: 'Aquisição de trator e implementos.',
    documents: createDocuments(7),
  },
  {
    id: '3',
    producer: { name: 'Antônio Pereira', cpf: '456.789.123-00', address: 'Chácara Recanto, Km 12' },
    pronafLine: 'pronaf_mais_alimento',
    requestedValue: 32000,
    status: 'documentacao_pendente',
    entryDate: '2026-01-10',
    notes: 'Faltam documentos do imóvel.',
    documents: createDocuments(5),
  },
  {
    id: '4',
    producer: { name: 'Ana Santos', cpf: '321.654.987-00', address: 'Fazenda Esperança, BR-040' },
    pronafLine: 'custeio',
    requestedValue: 28000,
    status: 'nova',
    entryDate: '2026-01-28',
    documents: createDocuments(2),
  },
  {
    id: '5',
    producer: { name: 'Carlos Mendes', cpf: '654.987.321-00', address: 'Sítio Primavera, Zona Rural' },
    pronafLine: 'custeio',
    requestedValue: 55000,
    status: 'negada',
    entryDate: '2025-10-20',
    notes: 'DAP vencida. Orientado a renovar.',
    documents: createDocuments(8),
  },
  {
    id: '6',
    producer: { name: 'Francisca Lima', cpf: '789.123.456-00', address: 'Fazenda Santa Rita' },
    pronafLine: 'investimento',
    requestedValue: 95000,
    status: 'em_analise',
    entryDate: '2026-01-05',
    notes: 'Construção de curral e cerca.',
    documents: createDocuments(9),
  },
  {
    id: '7',
    producer: { name: 'Pedro Souza', cpf: '147.258.369-00', address: 'Chácara do Cedro, Estrada Velha' },
    pronafLine: 'custeio',
    requestedValue: 18000,
    status: 'nova',
    entryDate: '2026-02-01',
    documents: createDocuments(0),
  },
  {
    id: '8',
    producer: { name: 'Lucia Ferreira', cpf: '963.852.741-00', address: 'Sítio Bela Vista, Zona Rural' },
    pronafLine: 'custeio',
    requestedValue: 38000,
    status: 'aprovada',
    entryDate: '2025-12-18',
    notes: 'Custeio pecuário - bovinocultura de leite.',
    documents: createDocuments(10),
  },
];

export const monthlyData = [
  { month: 'Set', propostas: 3, valor: 85000 },
  { month: 'Out', propostas: 5, valor: 142000 },
  { month: 'Nov', propostas: 4, valor: 118000 },
  { month: 'Dez', propostas: 6, valor: 195000 },
  { month: 'Jan', propostas: 7, valor: 230000 },
  { month: 'Fev', propostas: 3, valor: 86000 },
];
