package com.example.demo.repository;

import com.example.demo.model.Contrat;
import com.example.demo.model.enums.StatutContrat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContratRepository extends JpaRepository<Contrat, Long> {
    List<Contrat> findByEtudiantId(Long etudiantId);
    List<Contrat> findByLogementProprietaireId(Long proprietaireId);
    boolean existsByLogementIdAndStatut(Long logementId, StatutContrat statut);
    List<Contrat> findByStatut(StatutContrat statut);
    List<Contrat> findByEtudiantIdAndLogementId(Long etudiantId, Long logementId);
}
