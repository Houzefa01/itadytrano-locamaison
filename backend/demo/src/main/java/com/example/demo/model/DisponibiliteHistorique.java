package com.example.demo.model;

import com.example.demo.model.enums.LogementStatut;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** Trace des changements de statut / disponibilité d'un logement. */
@Entity
@Table(name = "disponibilite_historique")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DisponibiliteHistorique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logement_id", nullable = false)
    private Logement logement;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private LogementStatut statut;

    private Boolean disponible;

    @CreationTimestamp
    @Column(name = "date_changement", updatable = false)
    private LocalDateTime dateChangement;
}
