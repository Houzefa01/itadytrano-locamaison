package com.example.demo.dto;
 
import com.example.demo.model.enums.AmenityCode;
import com.example.demo.model.enums.LogementType;
import com.example.demo.model.enums.ModePaiement;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.Set;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LogementRequest {
 
    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200)
    private String titre;
 
    private String description;
 
    @NotNull @DecimalMin("0.0")
    private BigDecimal prix;
 
    @NotNull
    private LogementType type;
 
    private String adresse;
    private String quartier;
 
    // Liste d'amenities (ex: ["eau", "wc"])
    private Set<AmenityCode> amenities;
 
    @Builder.Default @Min(1)
    private Integer nbrMaxPersonne = 1;

    // Caractéristiques détaillées
    private Integer nbrChambres;
    private Boolean wc;
    private BigDecimal caution;
    private BigDecimal avance;
    // Modes de paiement acceptés par le propriétaire (vide => tous acceptés)
    private Set<ModePaiement> modesPaiement;
    private String videoUrl;
    private String eauDistance;

    // GPS (optionnel à la création)
    private Double latitude;
    private Double longitude;
}
