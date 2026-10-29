package com.example.demo.dto;

import com.example.demo.model.enums.ReservationStatut;
import com.example.demo.model.enums.TypeReservation;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReservationResponse {
    private Long id;
    private Long logementId;
    private LogementResponse logement;
    private ProprietaireResponse etudiant;
    private LocalDate dateVisite;
    private String heureVisite;
    private ReservationStatut statut;
    private TypeReservation typeReservation;
    private BigDecimal montantTotal;
    private BigDecimal montantPaye;
    private LocalDateTime dateExpiration;
    private boolean confirmeParEtudiant;
    private boolean confirmeParProprietaire;
    private boolean visiteConfirmee;
    private LocalDateTime createdAt;
}
 
