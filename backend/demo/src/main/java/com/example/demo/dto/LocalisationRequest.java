// ─── LocalisationRequest.java ─────────────────────────────────────────────────
package com.example.demo.dto;
 
import jakarta.validation.constraints.*;
import lombok.*;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LocalisationRequest {
 
    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
    private Double latitude;
 
    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
    private Double longitude;
 
    private String adresseComplete;
    private String codePostal;
    private String lienGoogleMaps;
}