package com.example.demo.repository;

import com.example.demo.model.Favori;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriRepository extends JpaRepository<Favori, Long> {
    List<Favori> findByEtudiantId(Long etudiantId);
    Optional<Favori> findByEtudiantIdAndLogementId(Long etudiantId, Long logementId);
    boolean existsByEtudiantIdAndLogementId(Long etudiantId, Long logementId);
    void deleteByEtudiant_IdAndLogement_Id(Long etudiantId, Long logementId);
    List<Favori> findByEtudiant_IdOrderByCreatedAtDesc(Long etudiantId);
    long countByEtudiant_IdAndLogement_Id(Long etudiantId, Long logementId);
    List<Favori> findByLogementId(Long logementId);
}
