package com.example.demo.model;

import com.example.demo.model.enums.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "paiements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Paiement {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Users etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logement_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Logement logement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @NotNull @Positive
    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal montant; // en Ariary (MGA)

    @Enumerated(EnumType.STRING)
    @Column(name = "type_paiement", nullable = false, length = 25)
    private TypePaiement typePaiement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ModePaiement mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutPaiement statut = StatutPaiement.EN_ATTENTE;

    @Column(name = "reference_transaction", unique = true, length = 100)
    private String referenceTransaction;

    @Column(name = "preuve_url", length = 500)
    private String preuveUrl;

    @NotNull
    @Column(name = "date_paiement", nullable = false)
    private LocalDate datePaiement;

    @Column(name = "periode_debut")
    private LocalDate periodeDebut;

    @Column(name = "periode_fin")
    private LocalDate periodeFin;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
