package com.example.demo.dto;
 
import lombok.*;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProprietaireResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String telephone;
    private String avatarUrl;
    private Boolean verifie;
}
 
 

