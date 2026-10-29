-- Profil étendu (étudiant : école + date de naissance ; bailleur : adresse + moyen de paiement)
-- et support de la réinitialisation de mot de passe par email.
ALTER TABLE public.utilisateurs
    ADD COLUMN IF NOT EXISTS date_naissance     date,
    ADD COLUMN IF NOT EXISTS ecole_id           bigint,
    ADD COLUMN IF NOT EXISTS adresse            varchar(255),
    ADD COLUMN IF NOT EXISTS moyen_paiement     varchar(255),
    ADD COLUMN IF NOT EXISTS bailleur_verifie   boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS reset_token        varchar(255),
    ADD COLUMN IF NOT EXISTS reset_token_expiry timestamp(6);

ALTER TABLE public.utilisateurs
    ADD CONSTRAINT fk_utilisateurs_ecole
    FOREIGN KEY (ecole_id) REFERENCES public.etablissements (id) ON DELETE SET NULL;
