// ─── Documentation Types & Constants ───────────────────────────

export interface DocumentType {
  key: string;
  label: string;
  /** GED document identifier (e.g. GED-001) */
  ged_id: string;
  /** URL where the document can be obtained (shown as a link in the upload card) */
  obtencaoUrl?: string;
  /** Name of the source institution (e.g. INCRA, CNJ, IBAMA) */
  fonte?: string;
  /** Group identifier for section separation in the UI (e.g. 'ambiental') */
  group?: string;
}

export const DOCUMENTATION_REQUIRED: DocumentType[] = [
  { key: "rg", label: "RG", ged_id: "GED-001" },
  { key: "ficha_cadastro_cliente", label: "FICHA CADASTRO CLIENTE", ged_id: "GED-002" },
  { key: "ficha_cadastro_esposa", label: "FICHA CADASTRO CÔNJUGE", ged_id: "GED-003" },
  { key: "rg_esposa", label: "RG CÔNJUGE", ged_id: "GED-004" },
  { key: "certidao_casamento", label: "CERTIDÃO CASAMENTO", ged_id: "GED-005" },
  { key: "procuracao", label: "PROCURAÇÃO", ged_id: "GED-006" },
  { key: "rg_procurador", label: "RG PROCURADOR", ged_id: "GED-007" },
  { key: "caf_extrato", label: "CAF - EXTRATO COMPLETO", ged_id: "GED-008" },
  { key: "espelho_beneficiario", label: "ESPELHO BENEFICIÁRIO", ged_id: "GED-009" },
  { key: "titulo_dominio", label: "TÍTULO DE DOMÍNIO", ged_id: "GED-010" },
  { key: "car_individual", label: "CAR INDIVIDUAL", ged_id: "GED-011" },
  { key: "car_coletivo", label: "CAR COLETIVO", ged_id: "GED-012" },
  { key: "dcaa", label: "DCAA", ged_id: "GED-013", group: "ambiental" },
  { key: "declaracoes_unificadas", label: "DECLARAÇÕES UNIFICADAS", ged_id: "GED-014" },
  { key: "certidao_improbidade", label: "CERTIDÃO IMPROBIDADE", ged_id: "GED-015", obtencaoUrl: "https://www.cnj.jus.br/improbidade_adm/consultar_requerido.php", fonte: "CNJ" },
  { key: "certidao_embargo_ambiental", label: "CERTIDÃO NEGATIVA DE EMBARGO AMBIENTAL", ged_id: "GED-016", obtencaoUrl: "https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaPublicaAreasEmbargadas.php", fonte: "IBAMA" },
  { key: "plano_assinado", label: "PLANO ASSINADO", ged_id: "GED-017" },
  { key: "plano_eletronico", label: "PLANO ELETRÔNICO", ged_id: "GED-018" },
  { key: "orcamento", label: "ORÇAMENTO", ged_id: "GED-019" },
  { key: "contrato_assessoria", label: "CONTRATO DE ASSESSORIA", ged_id: "GED-020" },
  { key: "declaracao_assistencia_tecnica", label: "DECLARAÇÃO ASSISTÊNCIA TÉCNICA", ged_id: "GED-021" },
  { key: "declaracao_suporte_hidrico", label: "DECLARAÇÃO DE SUPORTE HÍDRICO ANIMAIS", ged_id: "GED-022", group: "ambiental" },
  { key: "autorizacao_desmatamento_queima", label: "AUTORIZAÇÃO PARA DESMATAMENTO E QUEIMA CONTROLADA", ged_id: "GED-023", group: "ambiental" },
  { key: "declaracao_regularidade_ambiental", label: "DECLARAÇÃO DE REGULARIDADE AMBIENTAL", ged_id: "GED-024", group: "ambiental" },
  { key: "declaracao_recomposicao_reserva_car", label: "DECLARAÇÃO DE RECOMPOSIÇÃO RESERVA DO CAR", ged_id: "GED-025", group: "ambiental" },
  { key: "declaracao_nao_desmatamento", label: "DECLARAÇÃO DE NÃO DESMATAMENTO APÓS 22/07/2008 E DESMATAMENTO RURAL", ged_id: "GED-026", group: "ambiental" },
  { key: "declaracao_anexo_128", label: "DECLARAÇÃO ANEXO 128", ged_id: "GED-027", group: "ambiental" },
  {
    key: "carta_consulta",
    label: "CARTA CONSULTA",
    ged_id: "GED-028",
    obtencaoUrl: "https://saladacidadania.incra.gov.br/Beneficiario/ConsultaPublica?AspxAutoDetectCookieSupport=1",
    fonte: "INCRA",
  },
  { key: "autorizacao_modificacao_projeto", label: "AUTORIZAÇÃO MODIFICAÇÃO PROJETO", ged_id: "GED-029" },
  { key: "certidao_obito", label: "CERTIDÃO DE ÓBITO CÔNJUGE", ged_id: "GED-030" },
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
  /** GED document identifier assigned by the logged-in reviewer */
  ged_id: string | null;
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

export const AGENCY_DOCUMENTATION: { key: string; label: string }[] = [
  { key: "consulta_extrator_sicor", label: "CONSULTA EXTRATOR SICOR" },
  { key: "parecer_gerencial", label: "PARECER GERENCIAL" },
  { key: "consulta_s400", label: "CONSULTA S400" },
  { key: "consulta_historico_operacao_pronaf", label: "CONSULTA HISTÓRICO DE OPERAÇÃO PRONAF" },
  { key: "cadastro_atividade_plano", label: "CADASTRO ATIVIDADE PLANO" },
  { key: "consulta_restricoes_serasa", label: "CONSULTA RESTRIÇÕES SERASA" },
  { key: "avaliacao_risco", label: "AVALIAÇÃO RISCO" },
  { key: "registro_visita_gerencial", label: "REGISTRO VISITA GERENCIAL" },
];

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
  const reqDoc = DOCUMENTATION_REQUIRED.find((d) => d.key === key);
  if (reqDoc) return reqDoc.label;
  const agencyDoc = AGENCY_DOCUMENTATION.find((d) => d.key === key);
  if (agencyDoc) return agencyDoc.label;
  return key;
}
