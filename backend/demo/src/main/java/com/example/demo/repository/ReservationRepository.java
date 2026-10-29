package com.example.demo.repository;

import com.example.demo.model.Reservation;
import com.example.demo.model.enums.ReservationStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByEtudiantId(Long etudiantId);
    List<Reservation> findByLogementProprietaireId(Long proprietaireId);
    List<Reservation> findByLogementIdAndStatut(Long logementId, ReservationStatut statut);
    List<Reservation> findByLogementId(Long logementId);
    long countByLogementProprietaireIdAndStatut(Long proprietaireId, ReservationStatut statut);
    boolean existsByEtudiantIdAndLogementId(Long etudiantId, Long logementId);
    // Un logement est « réservé » s'il porte une réservation dans l'un de ces statuts.
    boolean existsByLogementIdAndStatutIn(Long logementId, Collection<ReservationStatut> statuts);
}
