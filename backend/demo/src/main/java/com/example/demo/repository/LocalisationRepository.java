package com.example.demo.repository;

import com.example.demo.model.Localisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface LocalisationRepository extends JpaRepository<Localisation, Long> {
    Optional<Localisation> findByLogementId(Long logementId);
    
    /** Logements publiés dans un rayon donné (km) autour d'un point — Haversine SQL */
    @Query(value = """
        SELECT loc.* FROM localisations loc
        JOIN logements l ON l.id = loc.logement_id
        WHERE l.statut = 'PUBLIE'
          AND (6371 * acos(
                cos(radians(:lat)) * cos(radians(loc.latitude))
                * cos(radians(loc.longitude) - radians(:lon))
                + sin(radians(:lat)) * sin(radians(loc.latitude))
              )) <= :radiusKm
    """, nativeQuery = true)
    List<Localisation> findWithinRadius(
        @Param("lat") double lat,
        @Param("lon") double lon,
        @Param("radiusKm") double radiusKm
    );
}
