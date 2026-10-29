package com.example.demo.service;

import com.example.demo.dto.ContratRequest;
import com.example.demo.dto.ContratResponse;
import com.example.demo.model.Contrat;
import com.example.demo.model.Logement;
import com.example.demo.model.Reservation;
import com.example.demo.model.Users;
import com.example.demo.model.enums.StatutContrat;
import com.example.demo.model.enums.TypeContrat;
import com.example.demo.repository.ContratRepository;
import com.example.demo.repository.LogementRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContratService {

    private final ContratRepository contratRepo;
    private final UserRepository userRepo;
    private final LogementRepository logementRepo;
    private final com.example.demo.repository.ReservationRepository reservationRepo;
    private final PaiementService paiementService;

    /**
     * Fin de bail (résiliation) par le propriétaire : le contrat passe TERMINE,
     * le logement redevient disponible et la réservation associée est clôturée.
     * C'est l'opération qui garantit la cohérence entre la vue bailleur et la
     * vue locataire (« libérer » = vraiment libérer pour tout le monde).
     */
    @Transactional
    public ContratResponse terminerBail(Long contratId, Long proprietaireId) {
        Contrat contrat = contratRepo.findById(contratId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrat non trouvé"));
        if (!contrat.getLogement().getProprietaire().getId().equals(proprietaireId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce contrat ne vous appartient pas");
        }

        // PROTECTION DU LOCATAIRE : impossible de mettre fin au bail si le loyer du
        // mois en cours (ou un mois payé d'avance) est déjà réglé. Le locataire a
        // droit d'occuper le logement pour la période qu'il a payée.
        if (paiementService.loyerCouvreMoisCourantOuFutur(
                contrat.getLogement().getId(), contrat.getEtudiant().getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Impossible de libérer : le locataire a déjà réglé le loyer du mois en cours ou d'un mois à venir.");
        }

        contrat.setStatut(StatutContrat.TERMINE);
        if (contrat.getDateFin() == null || contrat.getDateFin().isAfter(LocalDate.now())) {
            contrat.setDateFin(LocalDate.now());
        }

        // Le logement redevient disponible à la location.
        Logement logement = contrat.getLogement();
        logement.setDisponible(true);
        logementRepo.save(logement);

        // On clôture la réservation associée (et toute réservation encore active
        // sur ce logement) pour qu'il n'apparaisse plus « réservé » côté étudiant.
        reservationRepo.findByLogementId(logement.getId()).forEach(r -> {
            if (r.getStatut() != com.example.demo.model.enums.ReservationStatut.ANNULE
                    && r.getStatut() != com.example.demo.model.enums.ReservationStatut.ANNULE_REFUSE) {
                r.setStatut(com.example.demo.model.enums.ReservationStatut.ANNULE);
                reservationRepo.save(r);
            }
        });

        return toResponse(contratRepo.save(contrat));
    }

    @Transactional
    public ContratResponse creer(ContratRequest req, Long proprietaireId) {
        Users etudiant = userRepo.findById(req.getEtudiantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etudiant non trouvé"));
        Logement logement = logementRepo.findById(req.getLogementId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Logement non trouvé"));

        if (contratRepo.existsByLogementIdAndStatut(logement.getId(), StatutContrat.ACTIF)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ce logement a déjà un contrat actif");
        }

        if (!logement.getProprietaire().getId().equals(proprietaireId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'êtes pas le propriétaire de ce logement");
        }

        Contrat contrat = Contrat.builder()
                .etudiant(etudiant)
                .logement(logement)
                .dateDebut(req.getDateDebut())
                .dateFin(req.getDateFin())
                .dureeMois(req.getDureeMois())
                .loyerMensuel(req.getLoyerMensuel())
                .chargesMensuelles(req.getChargesMensuelles())
                .depotGarantie(req.getDepotGarantie())
                .typeContrat(req.getTypeContrat())
                .clauses(req.getClauses())
                .lieuSignature(req.getLieuSignature())
                .templateName(req.getTemplateName())
                .build();

        // Marquer le logement comme occupé
        logement.setDisponible(false);
        logementRepo.save(logement);

        Contrat saved = contratRepo.save(contrat);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ContratResponse> getMesContratsEtudiant(Long etudiantId) {
        return contratRepo.findByEtudiantId(etudiantId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ContratResponse> getMesContratsProprietaire(Long proprietaireId) {
        return contratRepo.findByLogementProprietaireId(proprietaireId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public Contrat genererDepuisReservation(Reservation reservation) {
        Logement logement = reservation.getLogement();

        // Le loyer vient du logement (le montantTotal de la réservation = loyer + caution).
        long loyer = logement.getPrix() != null ? logement.getPrix().longValue() : 0L;
        long caution = logement.getCaution() != null ? logement.getCaution().longValue() : 0L;

        // Idempotence : si un contrat actif existe déjà pour ce logement, on le réutilise.
        if (contratRepo.existsByLogementIdAndStatut(logement.getId(), StatutContrat.ACTIF)) {
            return contratRepo.findByLogementProprietaireId(logement.getProprietaire().getId()).stream()
                    .filter(c -> c.getLogement().getId().equals(logement.getId())
                            && c.getStatut() == StatutContrat.ACTIF)
                    .findFirst()
                    .orElse(null);
        }

        LocalDate debut = LocalDate.now();
        // Le loyer déjà réglé via la réservation (acompte) est crédité comme 1er mois de
        // loyer AVANT le calcul de la durée : l'échéancier affichera le mois 1 comme payé.
        paiementService.crediterPremierMoisLoyer(reservation, debut);
        // La durée du bail suit les loyers réglés : fin = (dernier mois payé) + 1 mois.
        // Au démarrage, elle reflète donc les mois payés à la signature.
        LocalDate dernierMois = paiementService.dernierMoisLoyerPaye(logement.getId(), reservation.getEtudiant().getId());
        // Durée = nombre de mois de loyer réglés (au moins 1 : l'acompte crédite le 1er mois).
        int dureeMois = 1;
        if (dernierMois != null) {
            dureeMois = (int) Math.max(1,
                java.time.temporal.ChronoUnit.MONTHS.between(debut.withDayOfMonth(1), dernierMois.withDayOfMonth(1)) + 1);
        }
        // La date de fin conserve le JOUR du début : chaque mois = 1 mois calendaire
        // (début le 10 juin + 1 mois => fin le 10 juillet).
        LocalDate dateFin = debut.plusMonths(dureeMois);

        Contrat contrat = Contrat.builder()
                .etudiant(reservation.getEtudiant())
                .logement(logement)
                .reservation(reservation)
                .dateDebut(debut)
                .dateFin(dateFin)
                .dureeMois(dureeMois)
                .loyerMensuel(loyer)
                .chargesMensuelles(0L)
                .depotGarantie(caution)
                .typeContrat(TypeContrat.BAIL_STUDIANT)
                .lieuSignature(logement.getQuartier() != null ? logement.getQuartier() : "Antsiranana")
                .clauses(clausesParDefaut(loyer, caution, Math.min(debut.getDayOfMonth() + 5, 28)))
                .statut(StatutContrat.ACTIF)
                .build();

        return contratRepo.save(contrat);
    }

    /** Clauses standard d'un bail étudiant (modèle LocaMaison). */
    private String clausesParDefaut(long loyer, long caution, int jourEcheance) {
        return String.join("\n",
            "1. Le présent bail est consenti pour un usage d'habitation à titre de résidence étudiante.",
            "2. Le loyer mensuel de " + loyer + " Ar est payable d'avance, au plus tard le " + jourEcheance + " de chaque mois (soit 5 jours après la date anniversaire du bail).",
            "3. Le locataire verse un dépôt de garantie de " + caution + " Ar, restitué en fin de bail déduction faite des éventuelles dégradations.",
            "4. Le locataire jouit paisiblement du logement et s'engage à l'entretenir en bon état.",
            "5. Toute sous-location est interdite sans accord écrit du bailleur.",
            "6. Le préavis de départ est d'un mois, notifié par écrit.",
            "7. À défaut de paiement, le bailleur peut résilier le bail après mise en demeure restée sans effet.");
    }

    private ContratResponse toResponse(Contrat c) {
        return ContratResponse.builder()
                .id(c.getId())
                .etudiantId(c.getEtudiant().getId())
                .etudiantNom(c.getEtudiant().getPrenom() + " " + c.getEtudiant().getNom())
                .logementId(c.getLogement().getId())
                .logementTitre(c.getLogement().getTitre())
                .dateDebut(c.getDateDebut())
                .dateFin(c.getDateFin())
                .dureeMois(c.getDureeMois())
                .loyerMensuel(c.getLoyerMensuel())
                .chargesMensuelles(c.getChargesMensuelles())
                .depotGarantie(c.getDepotGarantie())
                .typeContrat(c.getTypeContrat())
                .clauses(c.getClauses())
                .lieuSignature(c.getLieuSignature())
                .templateName(c.getTemplateName())
                .statut(c.getStatut())
                .documentUrl(c.getDocumentUrl())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
