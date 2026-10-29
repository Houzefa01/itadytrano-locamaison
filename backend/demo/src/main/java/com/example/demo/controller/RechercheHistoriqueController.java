package com.example.demo.controller;

import com.example.demo.model.RechercheHistorique;
import com.example.demo.repository.RechercheHistoriqueRepository;
import com.example.demo.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/historique-recherches")
@RequiredArgsConstructor
public class RechercheHistoriqueController {

    private final RechercheHistoriqueRepository repo;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RechercheHistorique>> mine(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(repo.findTop50ByUtilisateurIdOrderByCreatedAtDesc(principal.getUser().getId()));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> enregistrer(@RequestBody Map<String, String> body,
                                         @AuthenticationPrincipal UserPrincipal principal) {
        RechercheHistorique r = RechercheHistorique.builder()
                .utilisateur(principal.getUser())
                .criteres(body.getOrDefault("criteres", ""))
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(r));
    }
}
