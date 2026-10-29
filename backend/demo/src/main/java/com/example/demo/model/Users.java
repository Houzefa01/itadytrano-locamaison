package com.example.demo.model;

import com.example.demo.model.enums.UserRole;
import com.example.demo.model.enums.UserStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "utilisateurs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    @Column(nullable = false, length = 100)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(min = 2, max = 100, message = "Le prénom doit contenir entre 2 et 100 caractères")
    @Column(nullable = false, length = 100)
    private String prenom;

    // L'email est facultatif : seul le numéro de téléphone sert d'identifiant.
    @Email(message = "L'email n'est pas valide")
    @Column(unique = true, length = 150)
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_role", nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.ETUDIANT;

    // Identifiant de connexion : obligatoire et unique.
    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Pattern(regexp = "^[+0-9 ()\\-.]{6,25}$", message = "Numéro de téléphone invalide")
    @Column(nullable = false, unique = true, length = 25)
    private String telephone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = false;

    @Column(name = "verification_token", length = 255)
    private String verificationToken;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    // ── Profil étendu ────────────────────────────────────────────────────────
    /** École / faculté / université de rattachement (étudiant). */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ecole_id")
    private Etablissement ecole;

    /** Adresse (bailleur). */
    @Column(length = 255)
    private String adresse;

    /** Moyen de réception de paiement (bailleur), ex. Mvola/Orange Money/IBAN. */
    @Column(name = "moyen_paiement", length = 255)
    private String moyenPaiement;

    @Column(name = "bailleur_verifie", nullable = false)
    @Builder.Default
    private Boolean bailleurVerifie = false;

    // ── Réinitialisation de mot de passe ─────────────────────────────────────
    @Column(name = "reset_token", length = 255)
    @JsonIgnore
    private String resetToken;

    @Column(name = "reset_token_expiry")
    @JsonIgnore
    private LocalDateTime resetTokenExpiry;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Relations ────────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "proprietaire", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private List<Logement> logements = new ArrayList<>();

    @OneToMany(mappedBy = "etudiant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private List<Favori> favoris = new ArrayList<>();

    @OneToMany(mappedBy = "etudiant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private List<Reservation> reservations = new ArrayList<>();
}