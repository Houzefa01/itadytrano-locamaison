package com.example.demo.dto;
 
import lombok.*;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PhotoResponse {
    private Long id;
    private String url;
    private Boolean principale;
    private Integer ordre;
}
