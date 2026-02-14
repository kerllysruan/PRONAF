-- Migration to add new Proposal Status options to the ENUM
-- Note: ALTER TYPE ... ADD VALUE cannot be run inside a transaction block.

ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'visita_gerencial';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'avaliacao_risco';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'consideracoes_gerenciais';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'votacao_sinc';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'contrato_liberado';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'desembolso';
