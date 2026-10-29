package com.example.demo.dto;
 
import com.example.demo.model.enums.AmenityCode;
import com.example.demo.model.enums.LogementType;
import lombok.*;
import java.math.BigDecimal;
import java.util.Set;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FiltresLogement {
    private String quartier;
    private BigDecimal prixMin;
    private BigDecimal prixMax;
    private LogementType type;
    private Set<AmenityCode> amenities;
    private Double distanceMax;
    private Integer nbrPersonnes;
}
 
