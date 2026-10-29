package com.example.demo.model;

import com.example.demo.model.enums.StatutContrat;
import com.example.demo.model.enums.TypeContrat;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contrats")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Contrat {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Users etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logement_id", nullable = false)
    private Logement logement;

    @NotNull
    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(name = "duree_mois")
    private Integer dureeMois;

    @NotNull @Positive
    @Column(name = "loyer_mensuel", nullable = false)
    private Long loyerMensuel;  // en Ariary

    @NotNull @PositiveOrZero
    @Column(name = "charges_mensuelles", nullable = false)
    @Builder.Default
    private Long chargesMensuelles = 0L;

    @NotNull @PositiveOrZero
    @Column(name = "depot_garantie", nullable = false)
    private Long depotGarantie; // en Ariary

    @Enumerated(EnumType.STRING)
    @Column(name = "type_contrat", length = 30)
    @Builder.Default
    private TypeContrat typeContrat = TypeContrat.BAIL_STUDIANT;

    @Column(columnDefinition = "TEXT")
    private String clauses;

    @Column(name = "lieu_signature", length = 100)
    private String lieuSignature;

    @Column(name = "template_name", length = 50)
    private String templateName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutContrat statut = StatutContrat.ACTIF;

    @Column(name = "document_url", length = 500)
    private String documentUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
