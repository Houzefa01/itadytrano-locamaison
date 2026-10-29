package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Une vue unique d'une annonce par une personne donnée.
 * {@code viewer} vaut « u:&lt;idUtilisateur&gt; » pour un utilisateur connecté,
 * ou « ip:&lt;adresse&gt; » pour un visiteur anonyme. La contrainte d'unicité
 * (logement_id, viewer) garantit qu'une personne ne compte qu'une fois par annonce.
 */
@Entity
@Table(name = "logement_vues",
       uniqueConstraints = @UniqueConstraint(name = "uk_logement_vue",
               columnNames = {"logement_id", "viewer"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LogementVue {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "logement_id", nullable = false)
    private Long logementId;

    @Column(nullable = false, length = 120)
    private String viewer;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
