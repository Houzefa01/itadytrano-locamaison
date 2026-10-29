package com.example.demo.dto;
 
import lombok.*;
import java.time.LocalDateTime;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageResponse {
    private Long id;
    private Long expediteurId;
    private ProprietaireResponse expediteur;
    private Long destinataireId;
    private ProprietaireResponse destinataire;
    private Long logementId;
    private String contenu;
    private String attachmentUrl;
    private Boolean lu;
    private LocalDateTime createdAt;
}
