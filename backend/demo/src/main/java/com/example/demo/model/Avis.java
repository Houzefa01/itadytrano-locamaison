package com.example.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "avis")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Avis {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Users etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logement_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Logement logement;

    /** Réponse à un autre avis (fil de discussion). null = avis/commentaire racine. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Avis parent;

    /** Note optionnelle (1-5). null = simple commentaire sans note. */
    @Min(1) @Max(5)
    private Integer note;

    @NotBlank
    @Size(max = 1000)
    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
