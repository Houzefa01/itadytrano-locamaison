package com.example.demo.dto;
 
import com.example.demo.model.enums.LogementStatut;
import com.example.demo.model.enums.LogementType;
import com.example.demo.model.enums.ModePaiement;
import lombok.*;
import java.util.Set;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LogementResponse {
    private Long id;
    private String titre;
    private String description;
    private BigDecimal prix;
    private LogementType type;
    private String adresse;
    private String quartier;
    private Boolean disponible;
    private List<String> amenities;
    private Integer nbrMaxPersonne;
    private Integer nbrChambres;
    private Boolean wc;
    private BigDecimal caution;
    private BigDecimal avance;
    private Set<ModePaiement> modesPaiement;
    private String videoUrl;
    private String eauDistance;
    private LogementStatut statut;
    private LocalisationResponse localisation;
    private List<PhotoResponse> photos;
    private Double noteMoyenne;
    private Long nombreAvis;
    private Long nombreFavoris;
    private Long vues;
    private ProprietaireResponse proprietaire;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
 
