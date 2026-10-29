package com.example.demo.model;

import com.example.demo.model.enums.SignalementCible;
import com.example.demo.model.enums.SignalementStatut;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** Signalement d'un contenu/compte abusif ou frauduleux. */
@Entity
@Table(name = "signalements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Signalement {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "signaleur_id", nullable = false)
    private Users signaleur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SignalementCible cible;

    @Column(name = "cible_id", nullable = false)
    private Long cibleId;

    @Column(nullable = false, length = 500)
    private String motif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SignalementStatut statut = SignalementStatut.EN_ATTENTE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
