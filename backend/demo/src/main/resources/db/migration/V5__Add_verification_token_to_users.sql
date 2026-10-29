-- Migration: add verification_token to utilisateurs and clear existing users
DELETE FROM public.utilisateurs;

ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE public.utilisateurs ALTER COLUMN status SET DEFAULT 'PENDING';
UPDATE public.utilisateurs SET status = 'PENDING' WHERE status IS NULL;
