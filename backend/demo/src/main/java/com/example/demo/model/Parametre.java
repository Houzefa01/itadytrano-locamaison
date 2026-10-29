package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

/** Paramètre de configuration du site (clé/valeur), géré par l'admin. */
@Entity
@Table(name = "parametres")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Parametre {

    @Id
    @Column(length = 100)
    private String cle;

    @Column(length = 1000)
    private String valeur;

    @Column(length = 255)
    private String description;
}
