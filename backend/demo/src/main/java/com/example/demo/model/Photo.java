package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "photos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Photo {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logement_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Logement logement;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(nullable = false)
    @Builder.Default
    private Boolean principale = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordre = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
