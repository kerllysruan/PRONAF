export type ProposalStatus =
  | 'nova'
  | 'em_analise'
  | 'documentacao_pendente'
  | 'contrato_liberado'
  | 'desembolso_solicitado'
  | 'em_andamento'
  | 'aprovada' | 'negada';

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
  sicad?: string;
  credit_program?: string;
  request_type?: string;
  agency_code?: string;
  agency_name?: string;
  task?: string;
  central_date?: string;
  activity_start_date?: string;
  last_analyst?: string;
  owner?: string;
  originator?: string;
  current_state?: string;
  category?: string;
  client_size?: string;
  proposal_number?: string;
  credit_purpose?: string;
  resource_application?: string;
  special_treatment?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  completed: boolean;
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
  contrato_liberado: 'Contrato Liberado',
  desembolso_solicitado: 'Desembolso Solicitado',
  em_andamento: 'Em Andamento',
  aprovada: 'Contrato Assinado',
  negada: 'Negada',
};

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  nova: 'bg-sky-50 text-sky-700 border border-sky-200/60 font-medium dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800/60',
  em_analise: 'bg-blue-50 text-blue-700 border border-blue-200/60 font-medium dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/60',
  documentacao_pendente: 'bg-amber-50 text-amber-700 border border-amber-200/60 font-medium dark:bg-amber-950/30 dark:text-amber-500 dark:border-amber-800/60',
  contrato_liberado: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/60',
  desembolso_solicitado: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-medium dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/60',
  em_andamento: 'bg-violet-50 text-violet-700 border border-violet-200/60 font-medium dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/60',
  aprovada: 'bg-green-50 text-green-700 border border-green-200/60 font-medium dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/60',
  negada: 'bg-red-50 text-red-700 border border-red-200/60 font-medium dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/60',
};

export const ASSIGNABLE_TASK_TYPES = {
  avaliacao_risco: 'Avaliação De Risco',
  consideracoes_gerenciais: 'Considerações Gerenciais',
  votacao_sinc: 'Votação Sinc',
  desembolso: 'Desembolso',
} as const;

export type AssignableTaskType = keyof typeof ASSIGNABLE_TASK_TYPES;

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
