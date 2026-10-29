package com.example.demo.repository;

import com.example.demo.model.Logement;
import com.example.demo.model.enums.AmenityCode;
import com.example.demo.model.enums.LogementStatut;
import com.example.demo.model.enums.LogementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LogementRepository extends JpaRepository<Logement, Long>, JpaSpecificationExecutor<Logement> {
    Page<Logement> findByStatut(LogementStatut statut, Pageable pageable);
    Page<Logement> findByStatutAndDisponibleTrue(LogementStatut statut, Pageable pageable);
    Page<Logement> findByProprietaireId(Long proprietaireId, Pageable pageable);
    Page<Logement> findByProprietaireIdAndStatut(Long proprietaireId, LogementStatut statut, Pageable pageable);
    
    long countByProprietaireId(Long proprietaireId);
    long countByProprietaireIdAndStatut(Long proprietaireId, LogementStatut statut);

    /** Somme des vues de toutes les annonces d'un bailleur (0 s'il n'en a aucune). */
    @Query("SELECT COALESCE(SUM(l.vues), 0) FROM Logement l WHERE l.proprietaire.id = :proprietaireId")
    long sumVuesByProprietaireId(@Param("proprietaireId") Long proprietaireId);
    
    @Query("""
        SELECT l FROM Logement l
        WHERE (:statut     IS NULL OR l.statut = :statut)
          AND (:quartier   IS NULL OR LOWER(l.quartier) LIKE LOWER(CONCAT('%', CAST(:quartier AS string), '%')))
          AND (:type       IS NULL OR l.type = :type)
          AND (:prixMin    IS NULL OR l.prix >= :prixMin)
          AND (:prixMax    IS NULL OR l.prix <= :prixMax)
                    AND (
                        :amenities IS NULL OR :amenitiesCount = 0 OR
                        (SELECT COUNT(a) FROM l.amenities a WHERE a IN :amenities) = :amenitiesCount
                    )
          AND (:nbrPersonnes IS NULL OR l.nbrMaxPersonne >= :nbrPersonnes)
          AND (:nbrChambres IS NULL OR l.nbrChambres >= :nbrChambres)
          AND (:wc IS NULL OR l.wc = :wc)
          AND (l.statut <> com.example.demo.model.enums.LogementStatut.PUBLIE OR l.disponible = true)
    """)
    Page<Logement> search(
        @Param("statut")         LogementStatut statut,
        @Param("quartier")       String quartier,
        @Param("type")           LogementType type,
        @Param("prixMin")        Long prixMin,
        @Param("prixMax")        Long prixMax,
                @Param("amenities")      List<AmenityCode> amenities,
                @Param("amenitiesCount") long amenitiesCount,
        @Param("nbrPersonnes")   Integer nbrPersonnes,
        @Param("nbrChambres")    Integer nbrChambres,
        @Param("wc")             Boolean wc,
        Pageable pageable
    );
    
    @Query("SELECT l FROM Logement l WHERE l.statut = 'PUBLIE' ORDER BY l.createdAt DESC")
    List<Logement> findFeatured(Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Logement l SET l.vues = l.vues + 1 WHERE l.id = :id")
    void incrementerVues(@Param("id") Long id);

    List<Logement> findTop5ByOrderByVuesDesc();
}
