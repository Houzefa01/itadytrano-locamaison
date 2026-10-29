-- Ajout du type de réservation avec une valeur par défaut
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS type_reservation VARCHAR(255) DEFAULT 'VISITE' NOT NULL;

-- Ajout de la contrainte de check pour le type de réservation
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_type_reservation_check;

ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_type_reservation_check 
CHECK (type_reservation IN ('VISITE', 'DIRECTE'));

-- Ajout des autres colonnes manquantes
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS montant_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS montant_paye DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS date_expiration TIMESTAMP,
ADD COLUMN IF NOT EXISTS confirme_par_etudiant BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS confirme_par_proprietaire BOOLEAN DEFAULT FALSE NOT NULL;
