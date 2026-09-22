export type TipoCertidao = 'CPF' | 'CNPJ' | 'CIB';

export type StatusConsulta = 'OK' | 'ERRO' | 'PENDENTE' | 'PROCESSANDO' | 'AGUARDANDO_GOVBR';

export type SituacaoCertidao = 
  | 'CERTIDÃO NEGATIVA'
  | 'POSITIVA COM EFEITO DE NEGATIVA'
  | 'CERTIDÃO POSITIVA'
  | 'COM PENDÊNCIA'
  | 'PENDENTE'
  | string;

export interface CertidaoProdutor {
  id: string;
  agency_id: string | null;
  proposal_id: string | null;
  tipo: TipoCertidao;
  identificador: string;
  nome: string;
  data_nascimento: string | null;
  situacao: SituacaoCertidao | null;
  data_emissao: string | null;
  data_validade: string | null;
  codigo_controle: string | null;
  observacoes: string | null;
  status_consulta: StatusConsulta;
  motivo_erro: string | null;
  pdf_url: string | null;
  arquivo_nome: string | null;
  created_by: string | null;
  created_at: string;
  atualizado_em: string;
}

export type InsertCertidaoProdutor = Omit<
  CertidaoProdutor,
  'id' | 'created_at' | 'atualizado_em'
>;

export type UpdateCertidaoProdutor = Partial<InsertCertidaoProdutor>;
