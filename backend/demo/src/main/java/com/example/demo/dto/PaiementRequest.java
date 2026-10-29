package com.example.demo.dto;
 
import com.example.demo.model.enums.ModePaiement;
import com.example.demo.model.enums.TypePaiement;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaiementRequest {
 
    @NotNull private Long logementId;
    private Long reservationId;
 
    // Un paiement doit être strictement positif (cohérent avec l'entité Paiement).
    @NotNull @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal montant;
 
    @NotNull private TypePaiement typePaiement;
    @NotNull private ModePaiement mode;
 
    @NotNull private LocalDate datePaiement;
    private LocalDate periodeDebut;
    private LocalDate periodeFin;
    private String referenceTransaction;
    private String preuveUrl;
}
