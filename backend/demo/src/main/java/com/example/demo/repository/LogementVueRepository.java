package com.example.demo.repository;

import com.example.demo.model.LogementVue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LogementVueRepository extends JpaRepository<LogementVue, Long> {

    /**
     * Enregistre une vue (logement, viewer) de façon ATOMIQUE et idempotente.
     * Renvoie le nombre de lignes insérées : 1 si c'est une nouvelle vue pour cette
     * personne, 0 si elle avait déjà vu l'annonce (ON CONFLICT DO NOTHING).
     * Sans passer par un SELECT préalable, on évite toute race entre deux vues
     * simultanées de la même personne.
     */
    @Modifying
    @Query(value = "INSERT INTO logement_vues (logement_id, viewer, created_at) " +
                   "VALUES (:logementId, :viewer, now()) " +
                   "ON CONFLICT (logement_id, viewer) DO NOTHING",
           nativeQuery = true)
    int enregistrerVue(@Param("logementId") Long logementId, @Param("viewer") String viewer);
}
