-- 1. CORRECTION POUR LA TABLE 'PAIEMENTS'
-- On s'assure que la colonne statut est assez grande et on met à jour sa contrainte
ALTER TABLE public.paiements ALTER COLUMN statut TYPE VARCHAR(50);
ALTER TABLE public.paiements DROP CONSTRAINT IF EXISTS paiements_statut_check;
ALTER TABLE public.paiements ADD CONSTRAINT paiements_statut_check 
    CHECK (statut IN ('EN_ATTENTE', 'VALIDE', 'ECHOUE', 'REMBOURSE', 'SEQUESTRE', 'LOVER_MENSUEL'));

-- 2. CORRECTION POUR LA TABLE 'RESERVATIONS'
-- On augmente la taille pour accepter les longs statuts (ex: EN_ATTENTE_VALIDATION_PROPRIO)
ALTER TABLE public.reservations ALTER COLUMN statut TYPE VARCHAR(50);

-- On supprime l'ancienne contrainte restrictive pour la recréer proprement avec TOUS tes statuts
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_statut_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_statut_check 
    CHECK (statut IN (
        'EN_ATTENTE', 
        'VALIDE', 
        'REFUSE', 
        'ANNULE', 
        'EN_ATTENTE_VALIDATION_PROPRIO', 
        'ANNULE_REFUSE'
    ));