package com.example.demo.controller;

import com.example.demo.model.Users;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.UserPrincipal;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.SmsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final SmsService smsService;
    private final JwtUtil jwtUtil;

    // Voir son propre profil
    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(principal.getUser());
    }

    // Modifier son propre profil.
    // NB : le téléphone n'est PAS modifiable ici — il est l'identifiant de connexion
    // et tout changement exige une vérification par SMS (voir /telephone/request +
    // /telephone/confirm). Le champ telephone envoyé ici est donc ignoré.
    @PutMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                           @RequestBody Users updated) {
        Users user = principal.getUser();
        user.setNom(updated.getNom());
        user.setPrenom(updated.getPrenom());
        user.setAvatarUrl(updated.getAvatarUrl());
        return ResponseEntity.ok(userRepository.save(user));
    }

    // Étape 1 du changement de numéro : envoie un code de vérification par SMS au
    // NOUVEAU numéro. Le changement n'est appliqué qu'après confirmation du code.
    @PostMapping("/telephone/request")
    public ResponseEntity<?> requestTelephoneChange(@AuthenticationPrincipal UserPrincipal principal,
                                                    @RequestBody Map<String, String> body) {
        String newTel = body.get("telephone");
        if (newTel == null || newTel.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le nouveau numéro est obligatoire"));
        }
        newTel = newTel.trim();
        Users user = principal.getUser();
        if (newTel.equals(user.getTelephone())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ce numéro est déjà le vôtre"));
        }
        if (userRepository.existsByTelephone(newTel)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Numéro de téléphone déjà utilisé"));
        }
        // Envoi du code au nouveau numéro (persisté côté VerificationCode).
        smsService.sendVerificationCode(newTel);
        return ResponseEntity.ok(Map.of("message",
            "Un code de vérification a été envoyé par SMS au nouveau numéro."));
    }

    // Étape 2 : confirme le code reçu sur le nouveau numéro et applique le changement.
    // Le téléphone étant le sujet du JWT, on réémet un token à jour.
    @PostMapping("/telephone/confirm")
    public ResponseEntity<?> confirmTelephoneChange(@AuthenticationPrincipal UserPrincipal principal,
                                                    @RequestBody Map<String, String> body) {
        String newTel = body.get("telephone");
        String code = body.get("code");
        if (newTel == null || newTel.isBlank() || code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Numéro et code requis"));
        }
        newTel = newTel.trim();
        if (userRepository.existsByTelephone(newTel)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Numéro de téléphone déjà utilisé"));
        }
        if (!smsService.verifyCode(newTel, code)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Code invalide ou expiré"));
        }
        Users user = principal.getUser();
        user.setTelephone(newTel);
        userRepository.save(user);
        // Nouveau token : l'ancien (sujet = ancien numéro) n'est plus valable.
        String token = jwtUtil.generateToken(user.getTelephone(), user.getRole().name());
        return ResponseEntity.ok(Map.of(
            "message", "Votre numéro a été mis à jour.",
            "token", token));
    }

    // RGPD : suppression de son propre compte. On anonymise les données
    // personnelles et on désactive le compte (soft-delete) afin de préserver
    // l'intégrité référentielle (paiements, contrats) tout en effaçant les PII.
    @DeleteMapping
    public ResponseEntity<?> deleteAccount(@AuthenticationPrincipal UserPrincipal principal) {
        Users user = principal.getUser();
        String anon = "supprime_" + user.getId();
        user.setNom("Compte");
        user.setPrenom("supprimé");
        user.setEmail(null);
        user.setTelephone(anon);              // libère le numéro et anonymise l'identifiant
        user.setPassword("{deleted}");        // hash invalide -> connexion impossible
        user.setAvatarUrl(null);
        user.setAdresse(null);
        user.setMoyenPaiement(null);
        user.setIsActive(false);
        user.setIsVerified(false);
        user.setStatus(com.example.demo.model.enums.UserStatus.DELETED);
        userRepository.save(user);
        return ResponseEntity.ok(java.util.Map.of("message", "Votre compte a été supprimé."));
    }
}