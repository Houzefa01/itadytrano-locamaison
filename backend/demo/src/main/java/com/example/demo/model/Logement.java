package com.example.demo.model;

import com.example.demo.model.enums.AmenityCode;
import com.example.demo.model.enums.LogementStatut;
import com.example.demo.model.enums.LogementType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "logements")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Logement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Propriétaire ─────────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proprietaire_id", nullable = false)
    private Users proprietaire;

    // ── Informations générales ────────────────────────────────────────────────
    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String titre;

    @NotBlank(message = "La description est obligatoire")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @NotNull(message = "Le prix est obligatoire")
    @Positive(message = "Le prix doit être positif")
    @Column(nullable = false)
    private BigDecimal prix;                   // en Ariary (MGA)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LogementType type;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String adresse;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String quartier;

    // ── Disponibilite ─────────────────────────────────────────────────────────
    @Column(nullable = false) @Builder.Default private Boolean disponible      = true;

    /** Compteur de vues (statistiques). */
    @Column(nullable = false) @Builder.Default private Long vues = 0L;

    // ── Equipements (amenities) ───────────────────────────────────────────────
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "logement_amenities", joinColumns = @JoinColumn(name = "logement_id"))
    @Column(name = "amenity", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<AmenityCode> amenities = new HashSet<>();

    @NotNull
    @Min(1) @Max(20)
    @Column(name = "nbr_max_personne", nullable = false)
    private Integer nbrMaxPersonne;

    // ── Caractéristiques détaillées (cahier des charges) ──────────────────────
    @Column(name = "nbr_chambres")
    private Integer nbrChambres;

    @Column(name = "wc")
    @Builder.Default
    private Boolean wc = false;

    /** Caution demandée (Ariary). */
    @Column(name = "caution", precision = 38, scale = 2)
    private BigDecimal caution;

    /** Avance de réservation (Ariary). */
    @Column(name = "avance", precision = 38, scale = 2)
    private BigDecimal avance;

    /** Modes de paiement acceptés par le propriétaire pour ce logement.
     *  Le locataire ne pourra payer qu'avec l'un de ces modes. Si vide, tous
     *  les modes sont acceptés (compatibilité ascendante). */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "logement_modes_paiement", joinColumns = @JoinColumn(name = "logement_id"))
    @Column(name = "mode", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<com.example.demo.model.enums.ModePaiement> modesPaiementAcceptes = new HashSet<>();

    @Column(name = "video_url", length = 255)
    private String videoUrl;

    /** Distance d'approvisionnement en eau si externe (ex. "200 m"). */
    @Column(name = "eau_distance", length = 100)
    private String eauDistance;

    // ── Modération ────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private LogementStatut statut = LogementStatut.BROUILLON;

    // ── Agrégats (calculés côté applicatif) ───────────────────────────────────
    @Formula("(SELECT ROUND(AVG(a.note), 1) FROM avis a WHERE a.logement_id = id)")
    private Double noteMoyenne;

    @Formula("(SELECT COUNT(*) FROM avis a WHERE a.logement_id = id)")
    private Long nombreAvis;

    @Formula("(SELECT COUNT(*) FROM favoris f WHERE f.logement_id = id)")
    private Long nombreFavoris;

    // ── Timestamps ────────────────────────────────────────────────────────────
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Relations ─────────────────────────────────────────────────────────────
    @OneToOne(mappedBy = "logement", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private Localisation localisation;

    @OneToMany(mappedBy = "logement", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Photo> photos = new ArrayList<>();

    @OneToMany(mappedBy = "logement", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Avis> avis = new ArrayList<>();

    @OneToMany(mappedBy = "logement", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Reservation> reservations = new ArrayList<>();

    @OneToMany(mappedBy = "logement", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Paiement> paiements = new ArrayList<>();

    @OneToMany(mappedBy = "logement", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Contrat> contrats = new ArrayList<>();

    @OneToMany(mappedBy = "logement", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Favori> favoris = new ArrayList<>();

    @OneToMany(mappedBy = "logement", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Message> messages = new ArrayList<>();
}