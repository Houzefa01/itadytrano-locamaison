package com.example.demo.dto;
 
import lombok.*;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LocalisationResponse {
    private Long id;
    private Double latitude;
    private Double longitude;
    private String adresseComplete;
    private String ville;
    private String codePostal;
    private Double distanceCampusKm;
    private String lienGoogleMaps;
}
