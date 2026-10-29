-- ============================================================================
-- V26 : ajout du type de paiement ACOMPTE_RESERVATION a la contrainte CHECK
--       de la table paiements (acompte versé pour bloquer une réservation).
-- ============================================================================

ALTER TABLE public.paiements DROP CONSTRAINT IF EXISTS paiements_type_paiement_check;
ALTER TABLE public.paiements ADD CONSTRAINT paiements_type_paiement_check
  CHECK (type_paiement IN ('LOYER_MENSUEL','DEPOT_GARANTIE','ACOMPTE_RESERVATION','FRAIS_VISITE'));
