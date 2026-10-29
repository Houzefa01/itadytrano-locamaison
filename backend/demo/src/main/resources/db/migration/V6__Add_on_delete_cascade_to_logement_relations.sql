-- Contrats
ALTER TABLE contrats DROP CONSTRAINT IF EXISTS fkscu0tev2p674do5rmdrvbqnj1;
ALTER TABLE contrats ADD CONSTRAINT fkscu0tev2p674do5rmdrvbqnj1 FOREIGN KEY (logement_id) REFERENCES logements(id) ON DELETE CASCADE;

-- Reservations
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS fk6d0w3fyct8air5i4wjkc7tvr;
ALTER TABLE reservations ADD CONSTRAINT fk6d0w3fyct8air5i4wjkc7tvr FOREIGN KEY (logement_id) REFERENCES logements(id) ON DELETE CASCADE;

-- Paiements
ALTER TABLE paiements DROP CONSTRAINT IF EXISTS fkpclmqw7gf1e9yc15edj7nm6m4;
ALTER TABLE paiements ADD CONSTRAINT fkpclmqw7gf1e9yc15edj7nm6m4 FOREIGN KEY (logement_id) REFERENCES logements(id) ON DELETE CASCADE;

-- Avis
ALTER TABLE avis DROP CONSTRAINT IF EXISTS fkh3lqh1mqhwsigtplha9dxtsr2;
ALTER TABLE avis ADD CONSTRAINT fkh3lqh1mqhwsigtplha9dxtsr2 FOREIGN KEY (logement_id) REFERENCES logements(id) ON DELETE CASCADE;

-- Favoris
ALTER TABLE favoris DROP CONSTRAINT IF EXISTS fkt3l1axgqat81n2adck69ovkvt;
ALTER TABLE favoris ADD CONSTRAINT fkt3l1axgqat81n2adck69ovkvt FOREIGN KEY (logement_id) REFERENCES logements(id) ON DELETE CASCADE;

-- Photos
ALTER TABLE photos DROP CONSTRAINT IF EXISTS fkpoa2vpyrda9xy17a9rmp6vnia;
ALTER TABLE photos ADD CONSTRAINT fkpoa2vpyrda9xy17a9rmp6vnia FOREIGN KEY (logement_id) REFERENCES logements(id) ON DELETE CASCADE;

-- Localisations
ALTER TABLE localisations DROP CONSTRAINT IF EXISTS fkchgqa95yrdkvjyvqrtdi8o70o;
ALTER TABLE localisations ADD CONSTRAINT fkchgqa95yrdkvjyvqrtdi8o70o FOREIGN KEY (logement_id) REFERENCES logements(id) ON DELETE CASCADE;

-- Logement Amenities
ALTER TABLE logement_amenities DROP CONSTRAINT IF EXISTS fklltvd9ly05vabvsxu8oy32og;
ALTER TABLE logement_amenities ADD CONSTRAINT fklltvd9ly05vabvsxu8oy32og FOREIGN KEY (logement_id) REFERENCES logements(id) ON DELETE CASCADE;

-- Messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fkhsjha6xq6daw49llqi19xnw9a;
ALTER TABLE messages ADD CONSTRAINT fkhsjha6xq6daw49llqi19xnw9a FOREIGN KEY (logement_id) REFERENCES logements(id) ON DELETE CASCADE;
