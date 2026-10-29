package com.example.demo.service;

import com.example.demo.model.Reservation;
import com.example.demo.model.enums.ReservationStatut;
import com.example.demo.repository.ReservationRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationWorkflowService {

    private final ReservationRepository reservationRepository;
    private final ContratService contratService;
    private final ReservationNotificationService notificationService;

    public ReservationWorkflowService(ReservationRepository reservationRepository,
                                      @Lazy ContratService contratService,
                                      @Lazy ReservationNotificationService notificationService) {
        this.reservationRepository = reservationRepository;
        this.contratService = contratService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Reservation finaliserReservation(Reservation reservation) {
        ReservationStatut ancienStatut = reservation.getStatut();

        reservation.setStatut(ReservationStatut.LOGEMENT_RESERVE);
        reservation.setConfirmeParEtudiant(true);
        reservation.setConfirmeParProprietaire(true);
        reservation.setDateExpiration(null);
        reservation.getLogement().setDisponible(false);

        Reservation saved = reservationRepository.save(reservation);

        contratService.genererDepuisReservation(saved);

        notificationService.notifierChangementStatut(saved, ancienStatut);

        return saved;
    }
}
