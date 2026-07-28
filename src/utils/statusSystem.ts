/**
 * Sistema de Status Unificado — compartilhado entre Estoque, Propostas e Documentação.
 * Fonte única de verdade para labels, cores e fluxo de status.
 */

export type StockStatus =
  | 'AGUARDANDO ENTREVISTA'
  | 'DOCUMENTAÇÃO PENDENTE'
  | 'DOCUMENTAÇÃO APROVADA'
  | 'AUTORIZADO ENVIO CENTRAL'
  | 'ENVIADO PARA CENTRAL'
  | 'PENDÊNCIA CENTRAL'
  | 'EMITIR CONSIDERAÇÕES GERENCIAIS'
  | 'CONTRATADO'
  | 'CONCLUÍDO'
  | 'RESTRIÇÃO';

export interface StatusConfig {
  label: string;
  shortLabel: string;
  description: string;
  /** Tailwind classes for badge */
  badgeClass: string;
  /** Tailwind classes for dot indicator */
  dotClass: string;
  /** Hex for charts */
  hex: string;
  /** Order in the pipeline (0 = first) */
  order: number;
  /** Which page handles this status */
  page: 'estoque' | 'documentacao' | 'propostas' | 'all';
  /** Emoji icon */
  emoji: string;
}

export const STATUS_SYSTEM: Record<string, StatusConfig> = {
  'AGUARDANDO ENTREVISTA': {
    label: 'Aguardando Entrevista',
    shortLabel: 'Ag. Entrevista',
    description: 'Produtor aguarda entrevista para início do processo.',
    badgeClass: 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800/60',
    dotClass: 'bg-cyan-500',
    hex: '#06b6d4',
    order: 0,
    page: 'estoque',
    emoji: '⏳',
  },
  'RESTRIÇÃO': {
    label: 'Restrição',
    shortLabel: 'Restrição',
    description: 'Proposta possui restrição cadastral (Serasa/SCR).',
    badgeClass: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/60',
    dotClass: 'bg-red-500',
    hex: '#ef4444',
    order: 1,
    page: 'estoque',
    emoji: '🚫',
  },
  'DOCUMENTAÇÃO PENDENTE': {
    label: 'Documentação Pendente',
    shortLabel: 'Doc. Pendente',
    description: 'Documentos ainda não foram enviados ou estão incompletos.',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-500 dark:border-amber-800/60',
    dotClass: 'bg-amber-500',
    hex: '#f59e0b',
    order: 2,
    page: 'estoque',
    emoji: '📋',
  },
  'DOCUMENTAÇÃO APROVADA': {
    label: 'Documentação Aprovada',
    shortLabel: 'Doc. Aprovada',
    description: 'Toda a documentação foi revisada e aprovada.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/60',
    dotClass: 'bg-emerald-500',
    hex: '#10b981',
    order: 3,
    page: 'estoque',
    emoji: '✅',
  },
  'AUTORIZADO ENVIO CENTRAL': {
    label: 'Autorizado Envio Central',
    shortLabel: 'Aut. Central',
    description: 'Proposta autorizada para envio à Central.',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/60',
    dotClass: 'bg-blue-500',
    hex: '#3b82f6',
    order: 4,
    page: 'documentacao',
    emoji: '🔐',
  },
  'ENVIADO PARA CENTRAL': {
    label: 'Enviado para Central',
    shortLabel: 'Na Central',
    description: 'Proposta enviada para análise na Central.',
    badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/60',
    dotClass: 'bg-indigo-500',
    hex: '#6366f1',
    order: 5,
    page: 'documentacao',
    emoji: '📤',
  },
  'PENDÊNCIA CENTRAL': {
    label: 'Pendência Central',
    shortLabel: 'Pendência',
    description: 'Central solicitou esclarecimentos ou documentos adicionais.',
    badgeClass: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-500 dark:border-orange-800/60',
    dotClass: 'bg-orange-500',
    hex: '#f97316',
    order: 6,
    page: 'documentacao',
    emoji: '⚠️',
  },
  'EMITIR CONSIDERAÇÕES GERENCIAIS': {
    label: 'Considerações Gerenciais',
    shortLabel: 'Cons. Gerenciais',
    description: 'Aguardando emissão de considerações gerenciais.',
    badgeClass: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/60',
    dotClass: 'bg-violet-500',
    hex: '#8b5cf6',
    order: 7,
    page: 'documentacao',
    emoji: '📝',
  },
  'CONTRATADO': {
    label: 'Contratado',
    shortLabel: 'Contratado',
    description: 'Contrato assinado, aguardando conclusão.',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/60',
    dotClass: 'bg-purple-500',
    hex: '#a855f7',
    order: 8,
    page: 'estoque',
    emoji: '📄',
  },
  'CONCLUÍDO': {
    label: 'Concluído',
    shortLabel: 'Concluído',
    description: 'Processo encerrado com sucesso. Proposta no relatório final.',
    badgeClass: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/60',
    dotClass: 'bg-green-500',
    hex: '#22c55e',
    order: 9,
    page: 'propostas',
    emoji: '🏆',
  },
};

/**
 * Retorna a configuração de status, com fallback para status desconhecido.
 */
export function getStatusConfig(status: string | null | undefined): StatusConfig {
  if (!status) {
    return {
      label: '—',
      shortLabel: '—',
      description: 'Status não definido.',
      badgeClass: 'bg-slate-50 text-slate-600 border border-slate-200',
      dotClass: 'bg-slate-400',
      hex: '#94a3b8',
      order: -1,
      page: 'estoque',
      emoji: '❓',
    };
  }
  const normalized = status.trim().toUpperCase();
  return STATUS_SYSTEM[normalized] ?? {
    label: status,
    shortLabel: status.length > 12 ? status.substring(0, 12) + '…' : status,
    description: status,
    badgeClass: 'bg-slate-50 text-slate-600 border border-slate-200',
    dotClass: 'bg-slate-400',
    hex: '#94a3b8',
    order: -1,
    page: 'estoque',
    emoji: '🔘',
  };
}

/** Pipeline order for Kanban/timeline display */
export const PIPELINE_STAGES = [
  'AGUARDANDO ENTREVISTA',
  'RESTRIÇÃO',
  'DOCUMENTAÇÃO PENDENTE',
  'DOCUMENTAÇÃO APROVADA',
  'AUTORIZADO ENVIO CENTRAL',
  'ENVIADO PARA CENTRAL',
  'PENDÊNCIA CENTRAL',
  'EMITIR CONSIDERAÇÕES GERENCIAIS',
  'CONTRATADO',
  'CONCLUÍDO',
] as const;

/** Active (non-terminal) stages shown in Estoque */
export const ACTIVE_STAGES = PIPELINE_STAGES.filter(
  (s) => s !== 'CONCLUÍDO'
);

/** Map proposal table status to unified stock status */
export function proposalStatusToStock(status: string): string {
  const map: Record<string, string> = {
    nova: 'AGUARDANDO ENTREVISTA',
    em_analise: 'DOCUMENTAÇÃO PENDENTE',
    documentacao_pendente: 'DOCUMENTAÇÃO PENDENTE',
    contrato_liberado: 'AUTORIZADO ENVIO CENTRAL',
    desembolso_solicitado: 'ENVIADO PARA CENTRAL',
    em_andamento: 'CONTRATADO',
    aprovada: 'CONCLUÍDO',
    negada: 'RESTRIÇÃO',
  };
  return map[status] ?? status.toUpperCase();
}
