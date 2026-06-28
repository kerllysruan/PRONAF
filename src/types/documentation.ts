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
  { key: "ficha_cadastro_cliente", label: "FICHA CADASTRO CLIENTE" },
  { key: "ficha_cadastro_esposa", label: "FICHA CADASTRO CÔNJUGE" },
  { key: "rg_esposa", label: "RG CÔNJUGE" },
  { key: "certidao_casamento", label: "CERTIDÃO CASAMENTO" },
  { key: "procuracao", label: "PROCURAÇÃO" },
  { key: "rg_procurador", label: "RG PROCURADOR" },
  { key: "caf_extrato", label: "CAF - EXTRATO COMPLETO" },
  { key: "espelho_beneficiario", label: "ESPELHO BENEFICIÁRIO" },
  { key: "titulo_dominio", label: "TÍTULO DE DOMÍNIO" },
  { key: "car_individual", label: "CAR INDIVIDUAL" },
  { key: "car_coletivo", label: "CAR COLETIVO" },
  { key: "dcaa", label: "DCAA", group: "ambiental" },
  { key: "declaracoes_unificadas", label: "DECLARAÇÕES UNIFICADAS" },
  { key: "certidao_improbidade", label: "CERTIDÃO IMPROBIDADE", obtencaoUrl: "https://www.cnj.jus.br/improbidade_adm/consultar_requerido.php", fonte: "CNJ" },
  { key: "certidao_embargo_ambiental", label: "CERTIDÃO NEGATIVA DE EMBARGO AMBIENTAL", obtencaoUrl: "https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaPublicaAreasEmbargadas.php", fonte: "IBAMA" },
  { key: "plano_assinado", label: "PLANO ASSINADO" },
  { key: "plano_eletronico", label: "PLANO ELETRÔNICO" },
  { key: "orcamento", label: "ORÇAMENTO" },
  { key: "contrato_assessoria", label: "CONTRATO DE ASSESSORIA" },
  { key: "declaracao_assistencia_tecnica", label: "DECLARAÇÃO ASSISTÊNCIA TÉCNICA" },
  { key: "declaracao_suporte_hidrico", label: "DECLARAÇÃO DE SUPORTE HÍDRICO ANIMAIS", group: "ambiental" },
  { key: "autorizacao_desmatamento_queima", label: "AUTORIZAÇÃO PARA DESMATAMENTO E QUEIMA CONTROLADA", group: "ambiental" },
  { key: "declaracao_regularidade_ambiental", label: "DECLARAÇÃO DE REGULARIDADE AMBIENTAL", group: "ambiental" },
  { key: "declaracao_recomposicao_reserva_car", label: "DECLARAÇÃO DE RECOMPOSIÇÃO RESERVA DO CAR", group: "ambiental" },
  { key: "declaracao_nao_desmatamento", label: "DECLARAÇÃO DE NÃO DESMATAMENTO APÓS 22/07/2008 E DESMATAMENTO RURAL", group: "ambiental" },
  { key: "declaracao_anexo_128", label: "DECLARAÇÃO ANEXO 128", group: "ambiental" },
  {
    key: "carta_consulta",
    label: "CARTA CONSULTA",
    obtencaoUrl: "https://saladacidadania.incra.gov.br/Beneficiario/ConsultaPublica?AspxAutoDetectCookieSupport=1",
    fonte: "INCRA",
  },
  { key: "autorizacao_modificacao_projeto", label: "AUTORIZAÇÃO MODIFICAÇÃO PROJETO" },
  { key: "certidao_obito", label: "CERTIDÃO DE ÓBITO CÔNJUGE" },
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
