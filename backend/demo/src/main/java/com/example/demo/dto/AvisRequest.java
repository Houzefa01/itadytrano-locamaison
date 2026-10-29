package com.example.demo.dto;
 
import jakarta.validation.constraints.*;
import lombok.*;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AvisRequest {
 
    @NotNull
    private Long logementId;
 
    @Min(1) @Max(5)
    private Integer note;

    @NotBlank
    private String commentaire;

    /** Pour répondre à un avis existant (fil). */
    private Long parentId;
}
 
