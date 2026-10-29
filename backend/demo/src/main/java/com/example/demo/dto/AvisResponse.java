package com.example.demo.dto;
 
import lombok.*;
import java.time.LocalDateTime;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AvisResponse {
    private Long id;
    private ProprietaireResponse etudiant;
    private Integer note;
    private String commentaire;
    private Long parentId;
    private LocalDateTime createdAt;
}
