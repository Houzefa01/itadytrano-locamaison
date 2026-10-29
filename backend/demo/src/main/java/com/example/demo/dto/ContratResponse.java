package com.example.demo.dto;

import com.example.demo.model.enums.StatutContrat;
import com.example.demo.model.enums.TypeContrat;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ContratResponse {
    private Long id;
    private Long etudiantId;
    private String etudiantNom;
    private Long logementId;
    private String logementTitre;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer dureeMois;
    private Long loyerMensuel;
    private Long chargesMensuelles;
    private Long depotGarantie;
    private TypeContrat typeContrat;
    private String clauses;
    private String lieuSignature;
    private String templateName;
    private StatutContrat statut;
    private String documentUrl;
    private LocalDateTime createdAt;
}
