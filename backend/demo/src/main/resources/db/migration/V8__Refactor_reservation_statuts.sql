-- Refonte des statuts de réservation (workflow enrichi)
-- Agrandir la colonne de 20 → 40 car "en_attente_validation_proprio" fait 31 caractères
ALTER TABLE public.reservations
ALTER COLUMN statut TYPE VARCHAR(40);

ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS reservations_statut_check;

ALTER TABLE public.reservations
ADD CONSTRAINT reservations_statut_check
CHECK (statut IN ('EN_ATTENTE', 'VISITE_PLANIFIEE', 'ATTENTE_PAIEMENT', 'EN_ATTENTE_VALIDATION_PROPRIO', 'LOGEMENT_RESERVE', 'ANNULE', 'ANNULE_REFUSE'));

-- Ajout du champ visite_confirmee pour tracer la confirmation de visite
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS visite_confirmee BOOLEAN DEFAULT FALSE NOT NULL;

-- Ajout de reservation_id dans contrats pour lier contrat → réservation
ALTER TABLE public.contrats
ADD COLUMN IF NOT EXISTS reservation_id BIGINT;

ALTER TABLE public.contrats
DROP CONSTRAINT IF EXISTS fk_contrats_reservation;

ALTER TABLE ONLY public.contrats
ADD CONSTRAINT fk_contrats_reservation
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id);

-- Ajout du statut SEQUESTRE dans la contrainte paiements
ALTER TABLE public.paiements
DROP CONSTRAINT IF EXISTS paiements_statut_check;

ALTER TABLE public.paiements
ADD CONSTRAINT paiements_statut_check
CHECK (statut IN ('EN_ATTENTE', 'SEQUESTRE', 'VALIDE', 'REFUSE', 'REMBOURSE'));
