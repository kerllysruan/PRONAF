// ─── Documentation Types & Constants ───────────────────────────

export interface DocumentType {
  key: string;
  label: string;
  /** URL where the document can be obtained (shown as a link in the upload card) */
  obtencaoUrl?: string;
  /** Name of the source institution (e.g. INCRA, CNJ, IBAMA) */
  fonte?: string;
  /** Group identifier for section separation in the UI (e.g. 'ambiental') */
  group?: string;
}

export const DOCUMENTATION_REQUIRED: DocumentType[] = [
  { key: "rg", label: "RG" },
  { key: "ficha_cadastro_cliente", label: "Ficha Cadastro Cliente" },
  { key: "ficha_cadastro_esposa", label: "Ficha Cadastro Esposa" },
  { key: "rg_esposa", label: "RG Esposa" },
  { key: "certidao_casamento", label: "Certidão Casamento" },
  { key: "procuracao", label: "Procuração" },
  { key: "rg_procurador", label: "RG Procurador" },
  { key: "caf_extrato", label: "CAF - Extrato Completo" },
  { key: "espelho_beneficiario", label: "Espelho Beneficiário" },
  { key: "titulo_dominio", label: "Título de Domínio" },
  { key: "car_individual", label: "CAR Individual" },
  { key: "car_coletivo", label: "CAR Coletivo" },
  { key: "dcaa", label: "DCAA", group: "ambiental" },
  { key: "declaracoes_unificadas", label: "Declarações Unificadas" },
  { key: "certidao_improbidade", label: "Certidão Improbidade", obtencaoUrl: "https://www.cnj.jus.br/improbidade_adm/consultar_requerido.php", fonte: "CNJ" },
  { key: "certidao_embargo_ambiental", label: "Certidão Negativa de Embargo Ambiental", obtencaoUrl: "https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaPublicaAreasEmbargadas.php", fonte: "IBAMA" },
  { key: "plano_assinado", label: "Plano Assinado" },
  { key: "plano_eletronico", label: "Plano Eletrônico" },
  { key: "orcamento", label: "Orçamento" },
  { key: "contrato_assessoria", label: "Contrato de Assessoria" },
  { key: "declaracao_assistencia_tecnica", label: "Declaração Assistência Técnica" },
  { key: "declaracao_suporte_hidrico", label: "Declaração de Suporte Hídrico Animais", group: "ambiental" },
  { key: "autorizacao_desmatamento_queima", label: "Autorização para Desmatamento e Queima Controlada", group: "ambiental" },
  { key: "declaracao_regularidade_ambiental", label: "Declaração de Regularidade Ambiental", group: "ambiental" },
  { key: "declaracao_recomposicao_reserva_car", label: "Declaração de Recomposição Reserva do CAR", group: "ambiental" },
  { key: "declaracao_nao_desmatamento", label: "Declaração de Não Desmatamento após 22/07/2008 e Desmatamento Rural", group: "ambiental" },
  { key: "declaracao_anexo_128", label: "Declaração Anexo 128", group: "ambiental" },
  {
    key: "carta_consulta",
    label: "Carta Consulta",
    obtencaoUrl: "https://saladacidadania.incra.gov.br/Beneficiario/ConsultaPublica?AspxAutoDetectCookieSupport=1",
    fonte: "INCRA",
  },
  { key: "autorizacao_modificacao_projeto", label: "Autorização Modificação Projeto" },
];

export type DocFileStatus = "pendente" | "aprovado" | "reprovado";

export interface DocumentationToken {
  id: string;
  token: string;
  stock_proposal_id: string;
  created_at: string;
  documents_submitted: boolean;
  submitted_at: string | null;
  has_rejections: boolean;
  previous_status: string | null;
}

export interface DocumentationFile {
  id: string;
  token_id: string;
  stock_proposal_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  document_type: string;
  status: DocFileStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface DocumentationTokenWithProposal extends DocumentationToken {
  stock_proposals: {
    id: string;
    producer_name: string;
    producer_cpf: string | null;
    credit_program: string | null;
    municipio: string | null;
    estimated_value: number | null;
    projetista: string | null;
    linha_credito: string | null;
    status: string;
  };
}

export const DOC_STATUS_LABELS: Record<DocFileStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

export const DOC_STATUS_COLORS: Record<DocFileStatus, string> = {
  pendente: "bg-amber-100 text-amber-700 border-amber-200",
  aprovado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  reprovado: "bg-red-100 text-red-700 border-red-200",
};

export function getDocLabel(key: string): string {
  return DOCUMENTATION_REQUIRED.find((d) => d.key === key)?.label || key;
}
