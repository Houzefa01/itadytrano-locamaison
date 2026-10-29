package com.example.demo.repository;

import com.example.demo.model.Photo;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    List<Photo> findByLogementIdOrderByOrdreAsc(Long logementId);
    long countByLogementId(Long logementId);

    @Modifying
    @Query("""
        UPDATE Photo p
        SET p.principale = false
        WHERE p.logement.id = :logementId
    """)
    void resetPrincipale(@Param("logementId") Long logementId);
}
