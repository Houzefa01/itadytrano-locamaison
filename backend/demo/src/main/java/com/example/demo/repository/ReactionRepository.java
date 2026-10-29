package com.example.demo.repository;

import com.example.demo.model.Reaction;
import com.example.demo.model.enums.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    Optional<Reaction> findByUtilisateurIdAndLogementId(Long utilisateurId, Long logementId);
    long countByLogementIdAndType(Long logementId, ReactionType type);
}
