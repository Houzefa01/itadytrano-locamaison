package com.example.demo.repository;

import com.example.demo.model.Paiement;
import com.example.demo.model.enums.StatutPaiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {
    List<Paiement> findByEtudiantId(Long etudiantId);
    List<Paiement> findByLogementProprietaireId(Long proprietaireId);
    List<Paiement> findByEtudiantIdOrderByCreatedAtDesc(Long etudiantId);
    List<Paiement> findByLogementIdOrderByCreatedAtDesc(Long logementId);
    List<Paiement> findByStatutOrderByCreatedAtDesc(com.example.demo.model.enums.StatutPaiement statut);
    List<Paiement> findAllByOrderByCreatedAtDesc();
    List<Paiement> findByReservationIdAndStatut(Long reservationId, StatutPaiement statut);
    java.util.Optional<Paiement> findByReferenceTransaction(String referenceTransaction);
    List<Paiement> findByReservationId(Long reservationId);
    List<Paiement> findByReservationIdOrderByCreatedAtDesc(Long reservationId);
    // Loyers d'un étudiant pour un logement donné (échéancier / mois déjà réglés).
    List<Paiement> findByEtudiantIdAndLogementIdAndTypePaiement(
        Long etudiantId, Long logementId, com.example.demo.model.enums.TypePaiement typePaiement);
}
