-- Trigger to auto-create a disbursement request when a proposal is signed (status 'aprovada')

CREATE OR REPLACE FUNCTION public.trigger_auto_create_disbursement()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status changed to 'aprovada' (Contrato Assinado)
    IF NEW.status = 'aprovada' AND (OLD.status IS DISTINCT FROM 'aprovada') THEN
        -- Prevent duplicates
        IF NOT EXISTS (SELECT 1 FROM public.disbursements WHERE proposal_id = NEW.id) THEN
            INSERT INTO public.disbursements (
                user_id,
                proposal_id,
                amount,
                status,
                request_date,
                disbursement_type,
                notes,
                bank_name,
                agency,
                account
            ) VALUES (
                -- Use created_by (owner) or auth.uid() as fallback
                COALESCE(NEW.created_by, auth.uid()), 
                NEW.id,
                COALESCE(NEW.requested_value, 0),
                'pendente',
                NOW(),
                'total',
                'Gerado automaticamente após assinatura de contrato',
                '',
                '',
                ''
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_proposal_status_change ON public.proposals;
CREATE TRIGGER on_proposal_status_change
AFTER UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_create_disbursement();
