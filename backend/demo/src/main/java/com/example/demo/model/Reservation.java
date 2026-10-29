package com.example.demo.model;

import com.example.demo.model.enums.ReservationStatut;
import com.example.demo.model.enums.TypeReservation;
import jakarta.persistence.*;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "reservations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reservation {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Users etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logement_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Logement logement;

    @NotNull
    @FutureOrPresent(message = "La date doit être aujourd'hui ou dans le futur")
    @Column(name = "date_visite", nullable = false)
    private java.time.LocalDate dateVisite;

    /** Heure de la visite, issue du créneau choisi (ex. "14:00"). */
    @Column(name = "heure_visite", length = 10)
    private String heureVisite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    @Builder.Default
    private ReservationStatut statut = ReservationStatut.EN_ATTENTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_reservation", nullable = false, length = 100)
    @Builder.Default
    private TypeReservation typeReservation = TypeReservation.VISITE;

    @Column(name = "montant_total", precision = 10, scale = 2)
    private BigDecimal montantTotal;

    @Column(name = "montant_paye", precision = 10, scale = 2)
    private BigDecimal montantPaye;

    @Column(name = "date_expiration")
    private LocalDateTime dateExpiration;

    @Column(name = "confirme_par_etudiant")
    @Builder.Default
    private boolean confirmeParEtudiant = false;

    @Column(name = "confirme_par_proprietaire")
    @Builder.Default
    private boolean confirmeParProprietaire = false;

    @Column(name = "visite_confirmee")
    @Builder.Default
    private boolean visiteConfirmee = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
