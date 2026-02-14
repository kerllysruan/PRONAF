-- Add disbursement_type column to disbursements table
ALTER TABLE public.disbursements
ADD COLUMN disbursement_type TEXT NOT NULL DEFAULT 'total'
CHECK (disbursement_type IN ('total', 'parcial'));

-- Add comment
COMMENT ON COLUMN public.disbursements.disbursement_type IS 'Tipo de desembolso: total (100% do valor) ou parcial (valor customizado)';
