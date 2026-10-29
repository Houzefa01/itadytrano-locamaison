package com.example.demo.dto;

import com.example.demo.model.enums.StatutContrat;
import com.example.demo.model.enums.TypeContrat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ContratRequest {
    @NotNull private Long etudiantId;
    @NotNull private Long logementId;
    @NotNull private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer dureeMois;
    @NotNull @Positive private Long loyerMensuel;
    @NotNull @PositiveOrZero private Long chargesMensuelles;
    @NotNull @PositiveOrZero private Long depotGarantie;
    private TypeContrat typeContrat;
    private String clauses;
    private String lieuSignature;
    private String templateName;
}
