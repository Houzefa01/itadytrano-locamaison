package com.example.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "localisations")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Localisation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logement_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Logement logement;

    @NotNull
    @DecimalMin("-90.0") @DecimalMax("90.0")
    @Column(nullable = false)
    private Double latitude;

    @NotNull
    @DecimalMin("-180.0") @DecimalMax("180.0")
    @Column(nullable = false)
    private Double longitude;

    @Column(name = "adresse_complete", length = 300)
    private String adresseComplete;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String ville;

    @Column(name = "code_postal", length = 10)
    private String codePostal;

    /**
     * Distance au campus UNA d'Antsiranana — calculée via Haversine.
     * Campus UNA : lat=-12.3630, lon=49.2960 (approximatif)
     * Mise à jour automatiquement par {@code @PrePersist / @PreUpdate}.
     */
    @Column(name = "distance_campus_km")
    private Double distanceCampusKm;

    @Column(name = "lien_google_maps", length = 300)
    private String lienGoogleMaps;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Constantes campus UNA Antsiranana ─────────────────────────────────────
    private static final double CAMPUS_LAT = -12.28342;
    private static final double CAMPUS_LON =  49.30767;

    /** Calcule et stocke la distance via Haversine avant insert/update. */
    @PrePersist
    @PreUpdate
    public void computeDistanceCampus() {
        this.distanceCampusKm = haversine(this.latitude, this.longitude, CAMPUS_LAT, CAMPUS_LON);
        if (this.lienGoogleMaps == null || this.lienGoogleMaps.isBlank()) {
            this.lienGoogleMaps = "https://maps.google.com/?q=" + latitude + "," + longitude;
        }
    }

    /** Formule de Haversine — retourne la distance en km. */
    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double raw = R * c;
        return Math.round(raw * 10.0) / 10.0;  // arrondi à 1 décimale
    }
}