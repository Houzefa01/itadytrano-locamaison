-- Suppression de la date de naissance.
-- Le champ a été retiré du formulaire d'inscription et de l'entité Users ; la
-- colonne devient inutile. (Ajoutée initialement en V13.)
ALTER TABLE utilisateurs DROP COLUMN IF EXISTS date_naissance;
