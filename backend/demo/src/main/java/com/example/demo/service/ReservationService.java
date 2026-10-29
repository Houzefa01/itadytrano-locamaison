package com.example.demo.service;

import com.example.demo.dto.ReservationResponse;
import com.example.demo.model.Reservation;
import java.util.List;

public interface ReservationService {
    Reservation bookVisite(com.example.demo.dto.ReservationRequest request, com.example.demo.model.Users etudiant);
    List<Reservation> getReservationsByEtudiant(Long etudiantId);
    List<Reservation> getReservationsByProprietaire(Long proprietaireId);
    Reservation updateStatut(Long reservationId, String statut, com.example.demo.model.Users caller);
    Reservation confirmerReservation(Long reservationId, String role, com.example.demo.model.Users appelant);
    Reservation confirmerApresVisite(Long reservationId);
    Reservation validerReservationDirecte(Long reservationId);
    Reservation completerReservation(Long reservationId, java.math.BigDecimal montantComplement, com.example.demo.model.Users etudiant);
    Reservation modifierVisite(Long reservationId, java.time.LocalDate dateVisite, String heureVisite, Long proprietaireId);
    ReservationResponse toResponse(Reservation r);
}
