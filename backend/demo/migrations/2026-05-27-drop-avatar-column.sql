-- Migration: drop legacy avatar column from utilisateurs

ALTER TABLE public.utilisateurs DROP COLUMN IF EXISTS avatar;
