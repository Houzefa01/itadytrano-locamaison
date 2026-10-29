package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterestedUserResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String avatarUrl;
    private String type; // "PROPRIETAIRE", "ETUDIANT_FAVORI", "ETUDIANT_RESERVE"
}
