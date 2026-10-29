package com.example.demo.repository;

import com.example.demo.model.Signalement;
import com.example.demo.model.enums.SignalementStatut;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    List<Signalement> findAllByOrderByCreatedAtDesc();
    List<Signalement> findByStatutOrderByCreatedAtDesc(SignalementStatut statut);
    long countByStatut(SignalementStatut statut);
}
