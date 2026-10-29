-- ============================================================================
-- V23 : le numéro de téléphone devient l'identifiant de connexion.
--   * le téléphone passe obligatoire (NOT NULL) et unique ;
--   * l'adresse e-mail devient facultative (l'unicité reste, mais sur les
--     valeurs non nulles : PostgreSQL autorise plusieurs NULL).
-- ============================================================================

-- 1) L'e-mail n'est plus obligatoire.
ALTER TABLE public.utilisateurs ALTER COLUMN email DROP NOT NULL;

-- 2) Compléter les téléphones manquants hérités de l'ancien modèle,
--    où le numéro était facultatif. Valeur de remplacement unique par ligne.
UPDATE public.utilisateurs
   SET telephone = '00000' || id
 WHERE telephone IS NULL OR btrim(telephone) = '';

-- 3) Dédoublonner d'éventuels numéros identiques avant d'imposer l'unicité :
--    chaque ligne en doublon reçoit une valeur courte et unique fondée sur son id.
UPDATE public.utilisateurs
   SET telephone = '00000' || id
 WHERE telephone IN (
        SELECT telephone
          FROM public.utilisateurs
         GROUP BY telephone
        HAVING COUNT(*) > 1
       );

-- 4) Imposer l'obligation et l'unicité du téléphone (l'identifiant de connexion).
ALTER TABLE public.utilisateurs ALTER COLUMN telephone SET NOT NULL;
ALTER TABLE public.utilisateurs
  ADD CONSTRAINT uk_utilisateurs_telephone UNIQUE (telephone);
