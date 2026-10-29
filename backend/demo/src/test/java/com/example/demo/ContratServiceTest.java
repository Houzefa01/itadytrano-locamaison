package com.example.demo;

import com.example.demo.model.Contrat;
import com.example.demo.model.Logement;
import com.example.demo.model.Users;
import com.example.demo.model.enums.ReservationStatut;
import com.example.demo.model.enums.StatutContrat;
import com.example.demo.repository.ContratRepository;
import com.example.demo.repository.LogementRepository;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ContratService;
import com.example.demo.service.PaiementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/** Tests de la fin de bail : protection du locataire + libération du logement. */
class ContratServiceTest {

    private ContratRepository contratRepo;
    private UserRepository userRepo;
    private LogementRepository logementRepo;
    private ReservationRepository reservationRepo;
    private PaiementService paiementService;
    private ContratService service;

    private Logement logement;
    private Contrat contrat;

    @BeforeEach
    void setUp() {
        contratRepo = mock(ContratRepository.class);
        userRepo = mock(UserRepository.class);
        logementRepo = mock(LogementRepository.class);
        reservationRepo = mock(ReservationRepository.class);
        paiementService = mock(PaiementService.class);
        service = new ContratService(contratRepo, userRepo, logementRepo, reservationRepo, paiementService);

        Users proprietaire = Users.builder().id(4L).build();
        Users etudiant = Users.builder().id(1L).prenom("Sofia").nom("Rabe").build();
        logement = Logement.builder().id(10L).titre("Studio").proprietaire(proprietaire)
                .prix(new java.math.BigDecimal("300000")).disponible(false).build();
        contrat = Contrat.builder().id(3L).logement(logement).etudiant(etudiant)
                .loyerMensuel(300000L).depotGarantie(0L).statut(StatutContrat.ACTIF)
                .dateDebut(java.time.LocalDate.now()).build();
        when(contratRepo.findById(3L)).thenReturn(Optional.of(contrat));
        when(contratRepo.save(any(Contrat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservationRepo.findByLogementId(10L)).thenReturn(List.of());
    }

    @Test
    void finBail_refusee_siLoyerDuMoisCourantPaye() {
        when(paiementService.loyerCouvreMoisCourantOuFutur(10L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.terminerBail(3L, 4L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("déjà réglé");
        assertThat(contrat.getStatut()).isEqualTo(StatutContrat.ACTIF); // pas terminé
    }

    @Test
    void finBail_autorisee_libereLogement_etTermineContrat() {
        when(paiementService.loyerCouvreMoisCourantOuFutur(10L, 1L)).thenReturn(false);

        service.terminerBail(3L, 4L);

        assertThat(contrat.getStatut()).isEqualTo(StatutContrat.TERMINE);
        assertThat(logement.getDisponible()).isTrue(); // logement libéré
    }

    @Test
    void finBail_refusee_pourUnAutreProprietaire() {
        assertThatThrownBy(() -> service.terminerBail(3L, 999L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("appartient");
    }
}
