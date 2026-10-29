-- ============================================================================
-- V24 : réalignement des contraintes CHECK de statut sur les énumérations
--       actuelles du code. Certaines bases conservaient d'anciennes valeurs
--       (ex. reservations : 'VALIDE'/'REFUSE') qui bloquaient des transitions
--       valides comme 'VISITE_PLANIFIEE' (acceptation d'une visite).
-- ============================================================================

-- Réservations : flux visite -> paiement -> logement réservé
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_statut_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_statut_check
  CHECK (statut IN ('EN_ATTENTE','VISITE_PLANIFIEE','ATTENTE_PAIEMENT',
                    'EN_ATTENTE_VALIDATION_PROPRIO','LOGEMENT_RESERVE',
                    'ANNULE','ANNULE_REFUSE'));

-- Paiements
ALTER TABLE public.paiements DROP CONSTRAINT IF EXISTS paiements_statut_check;
ALTER TABLE public.paiements ADD CONSTRAINT paiements_statut_check
  CHECK (statut IN ('EN_ATTENTE','SEQUESTRE','VALIDE','REFUSE','REMBOURSE'));

-- Logements
ALTER TABLE public.logements DROP CONSTRAINT IF EXISTS logements_statut_check;
ALTER TABLE public.logements ADD CONSTRAINT logements_statut_check
  CHECK (statut IN ('BROUILLON','EN_ATTENTE','PUBLIE','REJETE','INDISPONIBLE'));

-- Contrats
ALTER TABLE public.contrats DROP CONSTRAINT IF EXISTS contrats_statut_check;
ALTER TABLE public.contrats ADD CONSTRAINT contrats_statut_check
  CHECK (statut IN ('ACTIF','TERMINE','RESILIE'));
