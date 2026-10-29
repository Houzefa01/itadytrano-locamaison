package com.example.demo.repository;

import com.example.demo.model.Avis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AvisRepository extends JpaRepository<Avis, Long> {
    List<Avis> findByLogementId(Long logementId);
    boolean existsByEtudiantIdAndLogementId(Long etudiantId, Long logementId);
    List<Avis> findByLogementIdOrderByCreatedAtDesc(Long logementId);
}
