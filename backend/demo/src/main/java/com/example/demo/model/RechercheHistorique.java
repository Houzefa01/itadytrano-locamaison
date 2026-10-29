package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** Historique des recherches d'un utilisateur. */
@Entity
@Table(name = "recherche_historique")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RechercheHistorique {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    @JsonIgnore
    private Users utilisateur;

    @Column(length = 500)
    private String criteres;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
