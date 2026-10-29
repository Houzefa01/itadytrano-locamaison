package com.example.demo.model;

import com.example.demo.model.enums.EtablissementType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Établissement d'enseignement (école, faculté, université…) utilisé pour
 * rattacher les étudiants et calculer la distance des logements.
 */
@Entity
@Table(name = "etablissements")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Etablissement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom de l'établissement est obligatoire")
    @Column(nullable = false, length = 200)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EtablissementType type = EtablissementType.UNIVERSITE;

    @Column(length = 255)
    private String adresse;

    @Column(length = 100)
    @Builder.Default
    private String ville = "Antsiranana";

    private Double latitude;
    private Double longitude;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
