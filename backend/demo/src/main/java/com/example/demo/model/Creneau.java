package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/** Créneau de disponibilité daté d'un logement (visites / réservations). */
@Entity
@Table(name = "creneaux")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Creneau {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logement_id", nullable = false)
    @JsonIgnore
    private Logement logement;

    /** Date de début de l'intervalle (jour de visite le plus tôt). */
    @Column(name = "date_creneau", nullable = false)
    private LocalDate dateCreneau;

    /** Date de fin de l'intervalle (incluse). NULL => créneau d'un seul jour. */
    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(name = "heure_debut", length = 5)
    private String heureDebut;

    @Column(name = "heure_fin", length = 5)
    private String heureFin;

    @Column(nullable = false)
    @Builder.Default
    private Boolean disponible = true;
}
