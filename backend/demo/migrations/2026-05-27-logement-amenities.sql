-- Migration: move logement amenities from boolean columns to join table

CREATE TABLE IF NOT EXISTS logement_amenities (
    logement_id BIGINT NOT NULL,
    amenity VARCHAR(50) NOT NULL,
    PRIMARY KEY (logement_id, amenity),
    CONSTRAINT fk_logement_amenities_logement
        FOREIGN KEY (logement_id) REFERENCES logements(id) ON DELETE CASCADE
);

INSERT INTO logement_amenities (logement_id, amenity)
SELECT id, 'EAU' FROM logements WHERE eau = true;

INSERT INTO logement_amenities (logement_id, amenity)
SELECT id, 'ELECTRICITE' FROM logements WHERE electricite = true;

INSERT INTO logement_amenities (logement_id, amenity)
SELECT id, 'WC' FROM logements WHERE wc = true;

INSERT INTO logement_amenities (logement_id, amenity)
SELECT id, 'DOUCHE' FROM logements WHERE douche = true;

INSERT INTO logement_amenities (logement_id, amenity)
SELECT id, 'PRES_DE_ROUTE' FROM logements WHERE pres_de_route = true;

INSERT INTO logement_amenities (logement_id, amenity)
SELECT id, 'AVOIR_COUR' FROM logements WHERE avoir_cour = true;

INSERT INTO logement_amenities (logement_id, amenity)
SELECT id, 'FACTURE_INCLUSE' FROM logements WHERE facture_incluse = true;

INSERT INTO logement_amenities (logement_id, amenity)
SELECT id, 'MEUBLE' FROM logements WHERE meuble = true;

INSERT INTO logement_amenities (logement_id, amenity)
SELECT id, 'SECURITE' FROM logements WHERE securite = true;

ALTER TABLE logements DROP COLUMN IF EXISTS eau;
ALTER TABLE logements DROP COLUMN IF EXISTS electricite;
ALTER TABLE logements DROP COLUMN IF EXISTS wc;
ALTER TABLE logements DROP COLUMN IF EXISTS douche;
ALTER TABLE logements DROP COLUMN IF EXISTS pres_de_route;
ALTER TABLE logements DROP COLUMN IF EXISTS avoir_cour;
ALTER TABLE logements DROP COLUMN IF EXISTS facture_incluse;
ALTER TABLE logements DROP COLUMN IF EXISTS meuble;
ALTER TABLE logements DROP COLUMN IF EXISTS securite;
