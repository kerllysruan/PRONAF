-- Migration to add all missing fields from PRONAF CSV export
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS central TEXT,
ADD COLUMN IF NOT EXISTS superintendence_code TEXT,
ADD COLUMN IF NOT EXISTS superintendence_name TEXT,
ADD COLUMN IF NOT EXISTS microcredit TEXT,
ADD COLUMN IF NOT EXISTS renegotiation_type TEXT,
ADD COLUMN IF NOT EXISTS guarantee_type TEXT,
ADD COLUMN IF NOT EXISTS registration_central_task TEXT,
ADD COLUMN IF NOT EXISTS registration_central_activity_start TEXT,
ADD COLUMN IF NOT EXISTS judicial_period TEXT,
ADD COLUMN IF NOT EXISTS requesting_unit TEXT,
ADD COLUMN IF NOT EXISTS agreement TEXT,
ADD COLUMN IF NOT EXISTS culture TEXT,
ADD COLUMN IF NOT EXISTS roc_type TEXT,
ADD COLUMN IF NOT EXISTS poa_prd_subject TEXT,
ADD COLUMN IF NOT EXISTS activity_id TEXT;
