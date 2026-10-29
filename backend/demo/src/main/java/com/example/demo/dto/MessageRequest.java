package com.example.demo.dto;
 
import jakarta.validation.constraints.*;
import lombok.*;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageRequest {
 
    @NotNull
    private Long destinataireId;
 
    private String contenu;
 
    private String attachmentUrl;

    private Long logementId; // optionnel
}
