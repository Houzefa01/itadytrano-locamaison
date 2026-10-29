-- Migration pour aligner la table logements avec l'entité JPA Logement
-- Supprime les colonnes booléennes redondantes qui causent des erreurs NOT NULL

ALTER TABLE public.logements DROP COLUMN IF EXISTS avoir_cour;
ALTER TABLE public.logements DROP COLUMN IF EXISTS douche;
ALTER TABLE public.logements DROP COLUMN IF EXISTS eau;
ALTER TABLE public.logements DROP COLUMN IF EXISTS electricite;
ALTER TABLE public.logements DROP COLUMN IF EXISTS facture_incluse;
ALTER TABLE public.logements DROP COLUMN IF EXISTS meuble;
ALTER TABLE public.logements DROP COLUMN IF EXISTS pres_de_route;
ALTER TABLE public.logements DROP COLUMN IF EXISTS securite;
ALTER TABLE public.logements DROP COLUMN IF EXISTS wc;
