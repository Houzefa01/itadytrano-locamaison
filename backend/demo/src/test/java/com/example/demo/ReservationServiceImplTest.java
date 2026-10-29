package com.example.demo;

import com.example.demo.dto.ReservationRequest;
import com.example.demo.model.Logement;
import com.example.demo.model.Reservation;
import com.example.demo.model.Users;
import com.example.demo.model.enums.ReservationStatut;
import com.example.demo.model.enums.TypeReservation;
import com.example.demo.repository.PaiementRepository;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.service.LogementService;
import com.example.demo.service.ReservationNotificationService;
import com.example.demo.service.ReservationWorkflowService;
import com.example.demo.service.impl.ReservationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Tests des règles métier de réservation (sans base de données) :
 * - visite gratuite vs réservation payante,
 * - blocage proportionnel à l'acompte (10% du loyer => 3 jours),
 * - interdiction de double réservation,
 * - montant total = loyer + caution.
 */
class ReservationServiceImplTest {

    private ReservationRepository reservationRepo;
    private LogementService logementService;
    private PaiementRepository paiementRepo;
    private ReservationWorkflowService workflowService;
    private ReservationNotificationService notificationService;
    private ReservationServiceImpl service;

    private Users etudiant;
    private Logement logement;

    @BeforeEach
    void setUp() {
        reservationRepo = mock(ReservationRepository.class);
        logementService = mock(LogementService.class);
        paiementRepo = mock(PaiementRepository.class);
        var creneauRepo = mock(com.example.demo.repository.CreneauRepository.class);
        workflowService = mock(ReservationWorkflowService.class);
        notificationService = mock(ReservationNotificationService.class);
        SimpMessagingTemplate messaging = mock(SimpMessagingTemplate.class);

        // Aucun créneau défini par défaut => aucune restriction sur les visites.
        when(creneauRepo.findByLogementIdOrderByDateCreneauAsc(any())).thenReturn(java.util.List.of());

        service = new ReservationServiceImpl(reservationRepo, logementService, paiementRepo,
                creneauRepo, workflowService, notificationService, messaging);

        etudiant = Users.builder().id(1L).nom("Rabe").prenom("Sofia").build();
        logement = Logement.builder()
                .id(10L).titre("Studio").prix(new BigDecimal("300000"))
                .caution(new BigDecimal("200000")).disponible(true).build();

        when(logementService.getLogementById(10L)).thenReturn(logement);
        when(reservationRepo.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void visite_estGratuite_etNeBloquePasLeLogement() {
        when(reservationRepo.findByLogementId(10L)).thenReturn(List.of());
        ReservationRequest req = ReservationRequest.builder()
                .logementId(10L).dateVisite(LocalDate.now().plusDays(1))
                .typeReservation(TypeReservation.VISITE).build();

        Reservation r = service.bookVisite(req, etudiant);

        assertThat(r.getStatut()).isEqualTo(ReservationStatut.EN_ATTENTE);
        assertThat(r.getDateExpiration()).isNull();
        assertThat(r.getMontantPaye()).isNull();
        assertThat(logement.getDisponible()).isTrue(); // pas de blocage
    }

    @Test
    void reservationPayante_bloque3JoursPour10Pourcent_etRendIndisponible() {
        when(reservationRepo.findByLogementId(10L)).thenReturn(List.of());
        ReservationRequest req = ReservationRequest.builder()
                .logementId(10L).dateVisite(LocalDate.now())
                .typeReservation(TypeReservation.DIRECTE)
                .montantPaye(new BigDecimal("30000")) // 10% de 300000
                .build();

        Reservation r = service.bookVisite(req, etudiant);

        assertThat(r.getStatut()).isEqualTo(ReservationStatut.LOGEMENT_RESERVE);
        // montant total = loyer + caution
        assertThat(r.getMontantTotal()).isEqualByComparingTo("500000");
        // blocage de 3 jours (10% d'un mois de 30 jours)
        long jours = ChronoUnit.DAYS.between(LocalDate.now().atStartOfDay(), r.getDateExpiration());
        assertThat(jours).isBetween(2L, 3L);
        assertThat(logement.getDisponible()).isFalse(); // logement bloqué
    }

    @Test
    void reservation_sansAcompte_estRefusee() {
        when(reservationRepo.findByLogementId(10L)).thenReturn(List.of());
        ReservationRequest req = ReservationRequest.builder()
                .logementId(10L).dateVisite(LocalDate.now())
                .typeReservation(TypeReservation.DIRECTE)
                .montantPaye(BigDecimal.ZERO).build();

        assertThatThrownBy(() -> service.bookVisite(req, etudiant))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("acompte");
    }

    @Test
    void doubleReservation_estRefusee_tantQueLeBlocageEstActif() {
        Reservation active = Reservation.builder()
                .id(99L).logement(logement).etudiant(etudiant)
                .typeReservation(TypeReservation.DIRECTE)
                .statut(ReservationStatut.LOGEMENT_RESERVE)
                .dateExpiration(java.time.LocalDateTime.now().plusDays(2))
                .build();
        when(reservationRepo.findByLogementId(10L)).thenReturn(List.of(active));

        ReservationRequest req = ReservationRequest.builder()
                .logementId(10L).dateVisite(LocalDate.now())
                .typeReservation(TypeReservation.DIRECTE)
                .montantPaye(new BigDecimal("30000")).build();

        assertThatThrownBy(() -> service.bookVisite(req, etudiant))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("déjà réservé");
    }
}
