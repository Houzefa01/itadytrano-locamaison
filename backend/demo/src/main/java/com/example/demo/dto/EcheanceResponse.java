package com.example.demo.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Une échéance mensuelle de loyer dans l'échéancier d'un contrat. */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EcheanceResponse {
    private String mois;          // format yyyy-MM
    private String libelle;       // ex. "juillet 2026"
    private LocalDate periode;    // 1er jour du mois concerné
    private BigDecimal montant;   // loyer dû pour ce mois
    private boolean paye;         // déjà couvert par un paiement (validé/séquestre/en attente)
    private String statut;        // statut du paiement couvrant ce mois (ou null)
}
