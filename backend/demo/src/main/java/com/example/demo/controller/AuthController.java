package com.example.demo.controller;

import com.example.demo.model.Users;
import com.example.demo.model.enums.*;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final com.example.demo.service.SmsService smsService;
    private final com.example.demo.repository.EtablissementRepository etablissementRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        // Le téléphone est l'identifiant : obligatoire et unique.
        if (request.getTelephone() == null || request.getTelephone().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le numéro de téléphone est obligatoire"));
        }
        String telephone = request.getTelephone().trim();
        if (userRepository.existsByTelephone(telephone)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Numéro de téléphone déjà utilisé"));
        }
        // L'email est facultatif : on contrôle l'unicité seulement s'il est renseigné.
        String email = (request.getEmail() != null && !request.getEmail().isBlank())
            ? request.getEmail().trim() : null;
        if (email != null && userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email déjà utilisé"));
        }

        UserRole role = parseRole(request.getRole());
        // Génération d'un code à 6 chiffres (générateur cryptographiquement sûr)
        String verificationCode = String.format("%06d", new java.security.SecureRandom().nextInt(1_000_000));

        com.example.demo.model.Etablissement ecole = null;
        if (request.getEcoleId() != null) {
            ecole = etablissementRepository.findById(request.getEcoleId()).orElse(null);
        }

        Users user = Users.builder()
            .nom(request.getNom())
            .prenom(request.getPrenom())
            .email(email)
            .password(passwordEncoder.encode(request.getPassword()))
            .telephone(telephone)
            .role(role)
            .ecole(ecole)
            .adresse(request.getAdresse())
            .moyenPaiement(request.getMoyenPaiement())
            .status(UserStatus.PENDING)
            .isVerified(false)
            .isActive(false)
            .verificationToken(verificationCode)
            .createdAt(LocalDateTime.now())
            .build();

        userRepository.save(user);

        // Envoi du SMS avec le code à 6 chiffres (canal principal : le téléphone est obligatoire)
        try {
            com.example.demo.dto.SmsRequest smsRequest = new com.example.demo.dto.SmsRequest();
            smsRequest.setPhoneNumber(user.getTelephone());
            smsRequest.setMessage("Bienvenue sur LocaMaison ! Votre code de vérification est : " + verificationCode);
            smsService.sendSms(smsRequest);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi du SMS de vérification: " + e.getMessage());
        }

        // Envoi de l'email avec le même code, seulement si une adresse a été renseignée
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            try {
                emailService.sendVerificationEmail(user.getEmail(), user.getPrenom() + " " + user.getNom(), verificationCode);
            } catch (Exception e) {
                System.err.println("Erreur lors de l'envoi de l'email de vérification: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of("message", "Inscription réussie. Veuillez saisir le code à 6 chiffres reçu par SMS."));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyAccount(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String telephone = body.get("telephone");

        if (code == null || telephone == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Téléphone et code requis"));
        }

        Optional<Users> userOpt = userRepository.findByTelephone(telephone);

        if (userOpt.isEmpty() || !code.equals(userOpt.get().getVerificationToken())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Code de vérification invalide"));
        }

        Users user = userOpt.get();
        user.setIsVerified(true);
        user.setIsActive(true);
        user.setStatus(UserStatus.ACTIVE);
        user.setVerificationToken(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Compte activé avec succès !"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Connexion par numéro de téléphone + mot de passe.
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getTelephone(), request.getPassword())
        );

        var user = userRepository.findByTelephone(request.getTelephone())
        .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("Utilisateur non trouvé"));


        String token = jwtUtil.generateToken(user.getTelephone(), user.getRole().name());
        return ResponseEntity.ok(Map.of("token", token));
    }

    // Prolonge la session : à partir d'un token encore valide, émet un nouveau
    // token (le rôle et l'état sont re-lus en base, pas repris du token).
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Token requis"));
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Token invalide ou expiré"));
        }
        String telephone = jwtUtil.extractUsername(token);
        var user = userRepository.findByTelephone(telephone)
            .filter(u -> u.getStatus() == UserStatus.ACTIVE)
            .orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Compte introuvable ou inactif"));
        }
        String fresh = jwtUtil.generateToken(user.getTelephone(), user.getRole().name());
        return ResponseEntity.ok(Map.of("token", fresh));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String telephone = body.get("telephone");
        if (telephone == null || telephone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Téléphone requis"));
        }
        userRepository.findByTelephone(telephone).ifPresent(user -> {
            String code = String.format("%06d", new java.security.SecureRandom().nextInt(1_000_000));
            user.setResetToken(code);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            // Code envoyé par SMS (canal principal) et par e-mail si une adresse existe.
            try {
                com.example.demo.dto.SmsRequest smsRequest = new com.example.demo.dto.SmsRequest();
                smsRequest.setPhoneNumber(user.getTelephone());
                smsRequest.setMessage("LocaMaison : votre code de réinitialisation est : " + code);
                smsService.sendSms(smsRequest);
            } catch (Exception e) {
                System.err.println("Erreur envoi SMS reset: " + e.getMessage());
            }
            if (user.getEmail() != null && !user.getEmail().isBlank()) {
                try {
                    emailService.sendPasswordResetEmail(user.getEmail(),
                        user.getPrenom() + " " + user.getNom(), code);
                } catch (Exception e) {
                    System.err.println("Erreur envoi email reset: " + e.getMessage());
                }
            }
        });
        // Réponse identique que le numéro existe ou non (anti-énumération de comptes)
        return ResponseEntity.ok(Map.of("message",
            "Si un compte existe pour ce numéro, un code de réinitialisation a été envoyé."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String telephone = body.get("telephone");
        String code = body.get("code");
        String newPassword = body.get("newPassword");
        if (telephone == null || code == null || newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error",
                "Téléphone, code et nouveau mot de passe (min. 8 caractères) requis"));
        }
        Optional<Users> userOpt = userRepository.findByTelephone(telephone);
        if (userOpt.isEmpty() || userOpt.get().getResetToken() == null
                || !code.equals(userOpt.get().getResetToken())
                || userOpt.get().getResetTokenExpiry() == null
                || userOpt.get().getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Code invalide ou expiré"));
        }
        Users user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès."));
    }

    // DTOs internes
    public record RegisterRequest(
        String nom, String prenom, String email,
        String password, String telephone, String role,
        Long ecoleId, String adresse, String moyenPaiement
    ) { public String getNom(){return nom;} public String getPrenom(){return prenom;}
        public String getEmail(){return email;} public String getPassword(){return password;}
        public String getTelephone(){return telephone;} public String getRole(){return role;}
        public Long getEcoleId(){return ecoleId;}
        public String getAdresse(){return adresse;} public String getMoyenPaiement(){return moyenPaiement;} }

    public record LoginRequest(String telephone, String password) {
        public String getTelephone(){return telephone;} public String getPassword(){return password;} }

    private static UserRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            return UserRole.ETUDIANT;
        }
        String normalized = role.trim().toUpperCase();
        // SECURITE: l'inscription publique ne peut JAMAIS attribuer le role ADMIN.
        // Seuls ETUDIANT et PROPRIETAIRE sont acceptables ; toute autre valeur
        // (y compris "ADMIN") retombe sur ETUDIANT. Les comptes admin se creent
        // exclusivement en base de donnees.
        if ("PROPRIETAIRE".equals(normalized)) {
            return UserRole.PROPRIETAIRE;
        }
        return UserRole.ETUDIANT;
    }
}