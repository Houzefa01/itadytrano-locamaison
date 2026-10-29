-- Créneaux de visite : la date devient un INTERVALLE.
-- date_creneau = date de début (existante), date_fin = date de fin (incluse).
-- Si date_fin est NULL, le créneau ne dure qu'un seul jour (date_creneau).
ALTER TABLE public.creneaux ADD COLUMN date_fin date;
