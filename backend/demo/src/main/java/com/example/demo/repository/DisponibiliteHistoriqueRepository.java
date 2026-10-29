package com.example.demo.repository;

import com.example.demo.model.DisponibiliteHistorique;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisponibiliteHistoriqueRepository extends JpaRepository<DisponibiliteHistorique, Long> {
    List<DisponibiliteHistorique> findByLogementIdOrderByDateChangementDesc(Long logementId);
}
