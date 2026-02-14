export type ProposalStatus =
  | 'nova'
  | 'em_analise'
  | 'documentacao_pendente'
  | 'visita_gerencial'
  | 'avaliacao_risco'
  | 'consideracoes_gerenciais'
  | 'votacao_sinc'
  | 'contrato_liberado'
  | 'desembolso'
  | 'aprovada' | 'negada'; // Kept for backward compatibility

export type PronafLine =
  | 'custeio'
  | 'custeio_renovacao'
  | 'pronaf_mais_alimento'
  | 'cartao_bnb'
  | 'pronaf_a_368'
  | 'pronaf_a_669'
  | 'pronaf_jovem'
  | 'investimento';

export interface Producer {
  name: string;
  cpf: string;
  address: string;
  phone?: string;
}

export interface Proposal {
  id: string;
  producer: Producer;
  pronafLine: PronafLine;
  requestedValue: number;
  status: ProposalStatus;
  entryDate: string;
  notes?: string;
  documents: DocumentItem[];
}

export interface DocumentItem {
  id: string;
  name: string;
  completed: boolean;
}

export type VisitStatus = 'agendada' | 'realizada' | 'cancelada';

export interface Visit {
  id: string;
  producerName: string;
  date: string;
  time: string;
  objective: string;
  status: VisitStatus;
  proposalId?: string;
}

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  nova: 'Nova',
  em_analise: 'Em Análise',
  documentacao_pendente: 'Doc. Pendente',
  visita_gerencial: 'Visita Gerencial',
  avaliacao_risco: 'Avaliação De Risco',
  consideracoes_gerenciais: 'Considerações Gerenciais',
  votacao_sinc: 'Votação Sinc',
  contrato_liberado: 'Contrato Liberado',
  desembolso: 'Desembolso',
  // Legacy
  aprovada: 'Aprovada',
  negada: 'Negada',
};

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  nova: 'bg-info text-info-foreground',
  em_analise: 'bg-warning text-warning-foreground',
  documentacao_pendente: 'bg-accent text-accent-foreground',
  visita_gerencial: 'bg-primary text-primary-foreground',
  avaliacao_risco: 'bg-destructive text-destructive-foreground',
  consideracoes_gerenciais: 'bg-muted text-muted-foreground',
  votacao_sinc: 'bg-indigo-500 text-white',
  contrato_liberado: 'bg-success text-success-foreground',
  desembolso: 'bg-emerald-600 text-white',
  // Legacy
  aprovada: 'bg-success text-success-foreground',
  negada: 'bg-destructive text-destructive-foreground',
};

export const PRONAF_LINE_LABELS: Record<PronafLine, string> = {
  custeio: 'Custeio',
  custeio_renovacao: 'Custeio - Renovação',
  pronaf_mais_alimento: 'Pronaf Mais - Alimento',
  cartao_bnb: 'Cartão BNB',
  pronaf_a_368: 'Pronaf A - 368',
  pronaf_a_669: 'Pronaf A - 669',
  pronaf_jovem: 'Pronaf Jovem',
  investimento: 'Investimento',
};

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  color: string;
}

export interface DocumentTask {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  proposalId: string;
  documentName?: string;
  createdAt: string;
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  baixa: 'bg-muted text-muted-foreground',
  media: 'bg-info text-info-foreground',
  alta: 'bg-warning text-warning-foreground',
  urgente: 'bg-destructive text-destructive-foreground',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
};

export const REQUIRED_DOCUMENTS = [
  'DAP/CAF',
  'CPF e RG',
  'Comprovante de Residência',
  'Certidão de Casamento/Nascimento',
  'Declaração do ITR',
  'CCIR',
  'Matrícula do Imóvel',
  'Projeto Técnico',
  'Orçamentos',
  'Certidões Negativas',
];
