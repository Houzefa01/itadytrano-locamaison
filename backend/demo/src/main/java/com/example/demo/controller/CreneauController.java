package com.example.demo.controller;

import com.example.demo.exceptions.ResourceNotFoundException;
import com.example.demo.model.Creneau;
import com.example.demo.repository.CreneauRepository;
import com.example.demo.repository.LogementRepository;
import com.example.demo.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/logements/{logementId}/creneaux")
@RequiredArgsConstructor
public class CreneauController {

    private final CreneauRepository creneauRepo;
    private final LogementRepository logementRepo;
    private final com.example.demo.service.LogementService logementService;

    /** Calendrier de disponibilité (public). */
    @GetMapping
    public ResponseEntity<List<Creneau>> all(@PathVariable Long logementId) {
        return ResponseEntity.ok(creneauRepo.findByLogementIdOrderByDateCreneauAsc(logementId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','ADMIN')")
    public ResponseEntity<Creneau> create(@PathVariable Long logementId, @RequestBody Creneau body,
                                          @AuthenticationPrincipal UserPrincipal principal) {
        var logement = logementRepo.findById(logementId)
                .orElseThrow(() -> new ResourceNotFoundException("Logement", logementId));
        if (!logement.getProprietaire().getId().equals(principal.getUser().getId())
                && !principal.getUser().getRole().name().equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        // Un logement occupé ou réservé n'accepte plus de nouveaux créneaux de visite.
        if (logementService.estOccupeOuReserve(logementId)) {
            throw new com.example.demo.exceptions.ValidationException(
                "Ce logement est occupé ou réservé : vous ne pouvez plus ajouter de créneaux de visite.");
        }
        body.setId(null);
        body.setLogement(logement);
        if (body.getDisponible() == null) body.setDisponible(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(creneauRepo.save(body));
    }

    @DeleteMapping("/{creneauId}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long logementId, @PathVariable Long creneauId,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        Creneau c = creneauRepo.findById(creneauId)
                .orElseThrow(() -> new ResourceNotFoundException("Créneau", creneauId));
        if (!c.getLogement().getProprietaire().getId().equals(principal.getUser().getId())
                && !principal.getUser().getRole().name().equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        creneauRepo.delete(c);
        return ResponseEntity.noContent().build();
    }
}
