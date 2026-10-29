package com.example.demo.controller;
 
import com.example.demo.dto.*;
import com.example.demo.model.enums.StatutPaiement;
import com.example.demo.service.PaiementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
 
@RestController
@RequestMapping("/api/v1/paiements")
@RequiredArgsConstructor
public class PaiementController {
 
    private final PaiementService paiementService;
    private final com.example.demo.repository.UserRepository userRepo;

    @org.springframework.beans.factory.annotation.Value("${payment.webhook.secret:dev-webhook-secret}")
    private String webhookSecret;

    @PostMapping
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<PaiementResponse> creer(
            @Valid @RequestBody PaiementRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(paiementService.creer(req, getUserId(ud)));
    }
 
    @GetMapping("/me")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<List<PaiementResponse>> getMesPaiements(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(paiementService.getMesPaiements(getUserId(ud)));
    }

    /** Échéancier de loyer du locataire pour un logement (mois payés / à payer). */
    @GetMapping("/echeancier/{logementId}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<List<EcheanceResponse>> getEcheancier(
            @PathVariable Long logementId,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(paiementService.getEcheancier(logementId, getUserId(ud)));
    }

    @GetMapping("/received")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<List<PaiementResponse>> getPaiementsRecus(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(paiementService.getPaiementsRecus(getUserId(ud)));
    }
 
    @GetMapping("/logement/{logementId}")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<List<PaiementResponse>> getPaiementsLogement(
            @PathVariable Long logementId,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(paiementService.getPaiementsLogement(logementId, getUserId(ud)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PaiementResponse>> getAllPaiements(
            @RequestParam(required = false) StatutPaiement statut,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(paiementService.getAllPaiements(statut));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<PaiementResponse> changerStatut(
            @PathVariable Long id,
            @RequestParam StatutPaiement statut,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(paiementService.changerStatut(id, statut, getUserId(ud)));
    }

    /** Remboursement d'un paiement (propriétaire du logement ou admin). */
    @PatchMapping("/{id}/rembourser")
    @PreAuthorize("hasRole('PROPRIETAIRE') or hasRole('ADMIN')")
    public ResponseEntity<PaiementResponse> rembourser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        boolean admin = ud.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(paiementService.rembourser(id, getUserId(ud), admin));
    }

    /** Solde du bailleur (disponible / en séquestre / remboursé). */
    @GetMapping("/solde")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<java.util.Map<String, Object>> solde(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(paiementService.getSoldeBailleur(getUserId(ud)));
    }

    /**
     * Webhook de confirmation de la passerelle de paiement (Orange Money / Mvola...).
     * Public mais authentifié par un secret partagé (en-tête X-Webhook-Secret),
     * et non par JWT — c'est le fournisseur, pas un utilisateur, qui appelle.
     * Corps attendu : { "reference": "...", "status": "SUCCESS"|"FAILED" }.
     */
    @PostMapping("/webhook/{provider}")
    public ResponseEntity<?> webhook(
            @PathVariable String provider,
            @RequestHeader(value = "X-Webhook-Secret", required = false) String secret,
            @RequestBody java.util.Map<String, String> body) {
        if (secret == null || !secret.equals(webhookSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(java.util.Map.of("error", "Signature invalide"));
        }
        String reference = body.get("reference");
        if (reference == null || reference.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "reference requise"));
        }
        boolean succes = "SUCCESS".equalsIgnoreCase(body.getOrDefault("status", ""));
        return ResponseEntity.ok(paiementService.confirmerViaWebhook(reference, succes));
    }

    private Long getUserId(UserDetails ud) {
        return userRepo.findByTelephone(ud.getUsername()).orElseThrow().getId();
    }
}
