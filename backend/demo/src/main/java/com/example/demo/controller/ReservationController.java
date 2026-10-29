package com.example.demo.controller;

import com.example.demo.dto.ReservationResponse;
import com.example.demo.model.Reservation;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @PreAuthorize("hasRole('ETUDIANT')") // un propriétaire ne peut pas faire de visite ni de réservation
    public ResponseEntity<ReservationResponse> createReservation(
            @RequestBody com.example.demo.dto.ReservationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reservationService.toResponse(reservationService.bookVisite(request, principal.getUser())));
    }

    @GetMapping("/me")
    public ResponseEntity<List<ReservationResponse>> getMyReservations(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
            reservationService.getReservationsByEtudiant(principal.getUserId())
                .stream()
                .map(reservationService::toResponse)
                .toList()
        );
    }

    @GetMapping("/received")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<List<ReservationResponse>> getReceivedReservations(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
            reservationService.getReservationsByProprietaire(principal.getUserId())
                .stream()
                .map(reservationService::toResponse)
                .toList()
        );
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<ReservationResponse> changeStatut(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String statut = body.get("statut");
        // L'autorisation fine (locataire = annuler la sienne ; propriétaire/admin = tout)
        // est vérifiée dans le service à partir de l'appelant.
        return ResponseEntity.ok(reservationService.toResponse(
                reservationService.updateStatut(id, statut, principal.getUser())));
    }

    @PatchMapping("/{id}/confirmer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReservationResponse> confirmer(
            @PathVariable Long id,
            @RequestParam String role,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reservationService.toResponse(
                reservationService.confirmerReservation(id, role, principal.getUser())));
    }

    @PatchMapping("/{id}/valider-directe")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<ReservationResponse> validerReservationDirecte(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.toResponse(reservationService.validerReservationDirecte(id)));
    }

    /** Le propriétaire modifie la date et l'heure de la visite. */
    @PatchMapping("/{id}/visite")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<ReservationResponse> modifierVisite(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        java.time.LocalDate date = body.get("dateVisite") != null && !body.get("dateVisite").isBlank()
                ? java.time.LocalDate.parse(body.get("dateVisite")) : null;
        String heure = body.get("heureVisite");
        return ResponseEntity.ok(reservationService.toResponse(
                reservationService.modifierVisite(id, date, heure, principal.getUserId())));
    }

    /** Le propriétaire confirme que la visite a bien eu lieu. */
    @PatchMapping("/{id}/confirmer-visite")
    public ResponseEntity<ReservationResponse> confirmerVisite(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.toResponse(reservationService.confirmerApresVisite(id)));
    }

    /** Le locataire complète sa réservation (loyer + caution) pour la transformer en location. */
    @PatchMapping("/{id}/completer")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<ReservationResponse> completer(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        java.math.BigDecimal montant = body.get("montant") != null
                ? new java.math.BigDecimal(body.get("montant").toString())
                : java.math.BigDecimal.ZERO;
        return ResponseEntity.ok(reservationService.toResponse(
                reservationService.completerReservation(id, montant, principal.getUser())));
    }
}
