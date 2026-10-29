-- ============================================================================
-- V28 : heure de la visite (issue du créneau choisi par l'étudiant).
-- ============================================================================
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS heure_visite VARCHAR(10);
