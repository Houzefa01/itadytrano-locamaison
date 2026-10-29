package com.example.demo.repository;

import com.example.demo.model.RechercheHistorique;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RechercheHistoriqueRepository extends JpaRepository<RechercheHistorique, Long> {
    List<RechercheHistorique> findTop50ByUtilisateurIdOrderByCreatedAtDesc(Long utilisateurId);
}
