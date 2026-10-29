package com.example.demo.service;

import com.example.demo.dto.InterestedUserResponse;
import com.example.demo.dto.LogementRequest;
import com.example.demo.dto.LogementResponse;
import com.example.demo.model.Logement;
import com.example.demo.model.Users;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface LogementService {
    Logement createLogement(LogementRequest request, Users proprietaire);
    Logement updateLogement(Long id, LogementRequest request);
    Logement getLogementById(Long id);
    void incrementerVues(Long id);

    /**
     * Enregistre une vue de l'annonce par la personne {@code viewer} (« u:&lt;id&gt; »
     * ou « ip:&lt;adresse&gt; ») et n'incrémente le compteur qu'à la PREMIÈRE vue.
     * @return true si c'était une nouvelle vue (compteur incrémenté), false sinon.
     */
    boolean enregistrerVue(Long logementId, String viewer);
    Page<Logement> getAllPublishedLogements(
            com.example.demo.model.enums.LogementStatut statut,
            String quartier,
            com.example.demo.model.enums.LogementType type,
            Long prixMin,
            Long prixMax,
            List<com.example.demo.model.enums.AmenityCode> amenities,
            Integer nbrPersonnes,
            Integer nbrChambres,
            Boolean wc,
            Pageable pageable);
    Page<Logement> getLogementsByProprietaire(Long proprietaireId, Pageable pageable);
    void deleteLogement(Long id);
    Logement updateStatut(Long id, com.example.demo.model.enums.LogementStatut statut);
    Logement updateAvailability(Long id, boolean disponible);

    /** true si le logement est occupé (contrat ACTIF) ou réservé : dans ce cas il ne
     *  peut être ni modifié, ni supprimé, ni recevoir de nouveaux créneaux de visite. */
    boolean estOccupeOuReserve(Long logementId);

    com.example.demo.dto.LandlordStatsResponse getLandlordStats(Long proprietaireId);

    public LogementResponse toResponse(Logement logement);

    List<InterestedUserResponse> getInterestedUsers(Long logementId);
}
