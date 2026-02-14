-- Migration to add new Pronaf Line options to the ENUM
-- Note: ALTER TYPE ... ADD VALUE cannot be run inside a transaction block.
-- These commands should be executed individually if using a tool that wraps migrations in transactions.
-- However, for reference and reproducibility, here are the commands executed.

ALTER TYPE pronaf_line ADD VALUE IF NOT EXISTS 'custeio_renovacao';
ALTER TYPE pronaf_line ADD VALUE IF NOT EXISTS 'pronaf_mais_alimento';
ALTER TYPE pronaf_line ADD VALUE IF NOT EXISTS 'cartao_bnb';
ALTER TYPE pronaf_line ADD VALUE IF NOT EXISTS 'pronaf_a_368';
ALTER TYPE pronaf_line ADD VALUE IF NOT EXISTS 'pronaf_a_669';
ALTER TYPE pronaf_line ADD VALUE IF NOT EXISTS 'pronaf_jovem';
