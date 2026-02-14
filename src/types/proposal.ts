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

export type ProjectDesigner =
  | 'ney_medeiros'
  | 'jairo_santana'
  | 'cledson'
  | 'jailson';

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
  projectDesigner?: ProjectDesigner;
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

export const PROJECT_DESIGNER_LABELS: Record<ProjectDesigner, string> = {
  ney_medeiros: 'Ney Medeiros',
  jairo_santana: 'Jairo Santana',
  cledson: 'Cledson',
  jailson: 'Jailson',
};

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
  aprovada: 'Contrato Assinado',
  negada: 'Negada',
};

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  // Modern gradient-based status colors with better visual hierarchy
  nova: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm shadow-cyan-500/30 border-0',
  em_analise: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/30 border-0',
  documentacao_pendente: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm shadow-violet-500/30 border-0',
  visita_gerencial: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30 border-0',
  avaliacao_risco: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-sm shadow-rose-500/30 border-0',
  consideracoes_gerenciais: 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-sm shadow-slate-500/30 border-0',
  votacao_sinc: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-600/30 border-0',
  contrato_liberado: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-500/30 border-0',
  desembolso: 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-sm shadow-green-600/30 border-0',
  // Legacy
  aprovada: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-500/30 border-0',
  negada: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-sm shadow-rose-500/30 border-0',
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
