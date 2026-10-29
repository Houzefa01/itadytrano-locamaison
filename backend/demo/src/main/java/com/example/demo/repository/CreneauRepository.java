package com.example.demo.repository;

import com.example.demo.model.Creneau;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreneauRepository extends JpaRepository<Creneau, Long> {
    List<Creneau> findByLogementIdOrderByDateCreneauAsc(Long logementId);
}
