package com.example.demo.repository;

import com.example.demo.model.Etablissement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EtablissementRepository extends JpaRepository<Etablissement, Long> {
    List<Etablissement> findAllByOrderByNomAsc();
}
