package com.example.demo.dto;

import com.example.demo.model.enums.TypeReservation;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReservationRequest {

    @NotNull(message = "Le logement est obligatoire")
    private Long logementId;

    @NotNull(message = "La date est obligatoire")
    @FutureOrPresent(message = "La date doit être aujourd'hui ou dans le futur")
    private LocalDate dateVisite;

    /** Heure de la visite (issue du créneau choisi), ex. "14:00". */
    private String heureVisite;

    private TypeReservation typeReservation;

    private BigDecimal montantTotal;

    private BigDecimal montantPaye;
}
 
