package com.example.demo.controller;

import com.example.demo.dto.ContratRequest;
import com.example.demo.dto.ContratResponse;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ContratService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contrats")
@RequiredArgsConstructor
public class ContratController {

    private final ContratService contratService;
    private final UserRepository userRepo;

    @PostMapping
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<ContratResponse> creer(
            @Valid @RequestBody ContratRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contratService.creer(req, getUserId(ud)));
    }

    @GetMapping("/etudiant/me")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<List<ContratResponse>> getMesContratsEtudiant(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(contratService.getMesContratsEtudiant(getUserId(ud)));
    }

    @GetMapping("/proprietaire/me")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<List<ContratResponse>> getMesContratsProprietaire(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(contratService.getMesContratsProprietaire(getUserId(ud)));
    }

    /** Fin de bail : libère le logement et clôture la réservation associée. */
    @PatchMapping("/{id}/terminer")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<ContratResponse> terminerBail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(contratService.terminerBail(id, getUserId(ud)));
    }

    private Long getUserId(UserDetails ud) {
        return userRepo.findByTelephone(ud.getUsername()).orElseThrow().getId();
    }
}
