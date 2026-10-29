-- ============================================================================
-- V25 : modes de paiement acceptes par le proprietaire pour chaque logement.
--       Le locataire ne pourra regler qu'avec l'un de ces modes. Si aucune
--       ligne n'existe pour un logement, tous les modes sont acceptes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logement_modes_paiement (
    logement_id BIGINT NOT NULL REFERENCES public.logements(id) ON DELETE CASCADE,
    mode        VARCHAR(20) NOT NULL,
    CONSTRAINT logement_modes_paiement_pk PRIMARY KEY (logement_id, mode),
    CONSTRAINT logement_modes_paiement_mode_check
        CHECK (mode IN ('MOBILE_MONEY','VIREMENT','ESPECES','CARTE'))
);

CREATE INDEX IF NOT EXISTS idx_logement_modes_paiement_logement
    ON public.logement_modes_paiement(logement_id);
