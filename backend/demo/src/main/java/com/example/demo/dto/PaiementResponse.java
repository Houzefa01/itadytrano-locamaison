package com.example.demo.dto;
 
import com.example.demo.model.enums.ModePaiement;
import com.example.demo.model.enums.StatutPaiement;
import com.example.demo.model.enums.TypePaiement;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaiementResponse {
    private Long id;
    private ProprietaireResponse etudiant;   // expéditeur (locataire)
    private ProprietaireResponse bailleur;   // destinataire (propriétaire)
    private String logementTitre;
    private Long logementId;
    private Long reservationId;
    private BigDecimal montant;
    private TypePaiement typePaiement;
    private ModePaiement mode;
    private StatutPaiement statut;
    private String referenceTransaction;
    private LocalDate datePaiement;
    private LocalDate periodeDebut;
    private LocalDate periodeFin;
    private LocalDateTime createdAt;
}
