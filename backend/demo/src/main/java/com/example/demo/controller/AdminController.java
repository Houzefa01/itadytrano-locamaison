package com.example.demo.controller;

import com.example.demo.model.enums.SignalementStatut;
import com.example.demo.model.enums.StatutPaiement;
import com.example.demo.repository.*;
import com.example.demo.service.RappelLoyerScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/** Utilitaires et statistiques d'administration. */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final RappelLoyerScheduler rappelScheduler;
    private final UserRepository userRepo;
    private final LogementRepository logementRepo;
    private final ReservationRepository reservationRepo;
    private final PaiementRepository paiementRepo;
    private final SignalementRepository signalementRepo;

    /** Déclenche manuellement le calcul des rappels/retards de loyer. */
    @PostMapping("/run-rappels")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> runRappels() {
        return ResponseEntity.ok(Map.of("notificationsEnvoyees", rappelScheduler.traiter()));
    }

    /** Statistiques globales de la plateforme. */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> stats() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("utilisateurs", userRepo.count());
        r.put("logements", logementRepo.count());
        r.put("reservations", reservationRepo.count());
        r.put("paiements", paiementRepo.count());
        r.put("signalementsEnAttente", signalementRepo.countByStatut(SignalementStatut.EN_ATTENTE));

        double revenu = paiementRepo.findByStatutOrderByCreatedAtDesc(StatutPaiement.VALIDE).stream()
                .map(p -> p.getMontant() == null ? BigDecimal.ZERO : p.getMontant())
                .mapToDouble(BigDecimal::doubleValue).sum();
        r.put("revenuValide", revenu);

        r.put("topVus", logementRepo.findTop5ByOrderByVuesDesc().stream()
                .map(l -> Map.of("id", l.getId(), "titre", l.getTitre(), "vues", l.getVues()))
                .toList());

        return ResponseEntity.ok(r);
    }
}
