-- Index de performance pour la recherche (objectif < 500 ms)
CREATE INDEX IF NOT EXISTS idx_logements_statut   ON public.logements (statut);
CREATE INDEX IF NOT EXISTS idx_logements_quartier ON public.logements (quartier);
CREATE INDEX IF NOT EXISTS idx_logements_type     ON public.logements (type);
CREATE INDEX IF NOT EXISTS idx_logements_prix     ON public.logements (prix);
CREATE INDEX IF NOT EXISTS idx_reservations_etudiant ON public.reservations (etudiant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_logement ON public.reservations (logement_id);
CREATE INDEX IF NOT EXISTS idx_paiements_etudiant ON public.paiements (etudiant_id);
CREATE INDEX IF NOT EXISTS idx_paiements_logement ON public.paiements (logement_id);
CREATE INDEX IF NOT EXISTS idx_avis_logement      ON public.avis (logement_id);
CREATE INDEX IF NOT EXISTS idx_favoris_logement   ON public.favoris (logement_id);
