package com.example.demo.controller;

import com.example.demo.exceptions.ResourceNotFoundException;
import com.example.demo.model.Signalement;
import com.example.demo.model.enums.SignalementCible;
import com.example.demo.model.enums.SignalementStatut;
import com.example.demo.repository.SignalementRepository;
import com.example.demo.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/signalements")
@RequiredArgsConstructor
public class SignalementController {

    private final SignalementRepository repo;

    /** Tout utilisateur connecté peut signaler une annonce / un compte / un avis. */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body,
                                    @AuthenticationPrincipal UserPrincipal principal) {
        if (body.get("cible") == null || body.get("cibleId") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "cible et cibleId requis"));
        }
        Signalement s = Signalement.builder()
                .signaleur(principal.getUser())
                .cible(SignalementCible.valueOf(body.get("cible").toString()))
                .cibleId(Long.valueOf(body.get("cibleId").toString()))
                .motif(body.getOrDefault("motif", "").toString())
                .statut(SignalementStatut.EN_ATTENTE)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(s));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> all(@RequestParam(required = false) SignalementStatut statut) {
        return ResponseEntity.ok(statut != null
                ? repo.findByStatutOrderByCreatedAtDesc(statut)
                : repo.findAllByOrderByCreatedAtDesc());
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatut(@PathVariable Long id, @RequestParam SignalementStatut statut) {
        Signalement s = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Signalement", id));
        s.setStatut(statut);
        return ResponseEntity.ok(repo.save(s));
    }
}
