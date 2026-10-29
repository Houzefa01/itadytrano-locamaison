-- ============================================================================
-- V27 : coordonnées GPS réelles des établissements d'Antsiranana
--       (source : OpenStreetMap / Nominatim). Remplace les valeurs
--       approximatives initiales. Mise à jour par nom (identifiant stable).
-- ============================================================================

UPDATE public.etablissements SET latitude = -12.2834182, longitude = 49.3076661
  WHERE nom = 'Université d''Antsiranana';

UPDATE public.etablissements SET latitude = -12.2789099, longitude = 49.3056840
  WHERE nom = 'ENSET Antsiranana';

UPDATE public.etablissements SET latitude = -12.2831278, longitude = 49.3065941
  WHERE nom = 'Faculté des Sciences';

UPDATE public.etablissements SET latitude = -12.2793198, longitude = 49.2872409
  WHERE nom = 'Institut Supérieur de Technologie';
