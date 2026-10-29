package com.example.demo.service.impl;

import com.example.demo.dto.ProprietaireResponse;
import com.example.demo.dto.ReservationResponse;
import com.example.demo.model.Paiement;
import com.example.demo.model.Reservation;
import com.example.demo.model.Users;
import com.example.demo.model.enums.ReservationStatut;
import com.example.demo.model.enums.StatutPaiement;
import com.example.demo.model.enums.TypeReservation;
import com.example.demo.repository.PaiementRepository;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.service.LogementService;
import com.example.demo.service.ReservationNotificationService;
import com.example.demo.service.ReservationService;
import com.example.demo.service.ReservationWorkflowService;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Service
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final LogementService logementService;
    private final PaiementRepository paiementRepo;
    private final com.example.demo.repository.CreneauRepository creneauRepository;
    private final ReservationWorkflowService workflowService;
    private final ReservationNotificationService notificationService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public ReservationServiceImpl(ReservationRepository reservationRepository,
                                  LogementService logementService,
                                  PaiementRepository paiementRepo,
                                  com.example.demo.repository.CreneauRepository creneauRepository,
                                  @Lazy ReservationWorkflowService workflowService,
                                  @Lazy ReservationNotificationService notificationService,
                                  @Lazy org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.reservationRepository = reservationRepository;
        this.logementService = logementService;
        this.paiementRepo = paiementRepo;
        this.creneauRepository = creneauRepository;
        this.workflowService = workflowService;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    @Scheduled(cron = "0 0 * * * *") // Toutes les heures
    @Transactional
    public void cancelExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> expired = reservationRepository.findAll().stream()
            .filter(r -> (r.getStatut() == ReservationStatut.EN_ATTENTE ||
                          r.getStatut() == ReservationStatut.ATTENTE_PAIEMENT ||
                          // blocage d'une réservation payante dont la date limite est dépassée
                          r.getStatut() == ReservationStatut.LOGEMENT_RESERVE) &&
                         r.getDateExpiration() != null &&
                         r.getDateExpiration().isBefore(now))
            .toList();

        for (Reservation r : expired) {
            r.setStatut(ReservationStatut.ANNULE);
            // Le blocage tombe : le logement redevient disponible pour les autres,
            // sauf s'il fait l'objet d'un contrat actif (occupation réelle).
            if (r.getLogement() != null) {
                r.getLogement().setDisponible(true);
            }
            marquerPaiementsAnnules(r);
            reservationRepository.save(r);
            notificationService.notifierExpiration(r);
            System.out.println("Réservation expirée et annulée : " + r.getId());
        }
    }

    @Override
    @Transactional
    public Reservation bookVisite(com.example.demo.dto.ReservationRequest request, Users etudiant) {
        TypeReservation type = request.getTypeReservation() != null ? request.getTypeReservation() : TypeReservation.VISITE;
        com.example.demo.model.Logement logement = logementService.getLogementById(request.getLogementId());

        Reservation.ReservationBuilder builder = Reservation.builder()
                .logement(logement)
                .etudiant(etudiant)
                .dateVisite(request.getDateVisite())
                .heureVisite(request.getHeureVisite())
                .typeReservation(type);

        if (type == TypeReservation.VISITE) {
            // VISITE = simple visite gratuite : aucun montant, aucun blocage du logement.
            // Si le propriétaire a proposé des créneaux, la date/heure demandée DOIT
            // tomber dans l'un d'eux, sinon la demande est refusée.
            if (!dansUnCreneau(logement.getId(), request.getDateVisite(), request.getHeureVisite())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "La date ou l'heure demandée ne correspond à aucun créneau de visite proposé. "
                        + "Choisissez un créneau proposé par le propriétaire.");
            }
            builder.statut(ReservationStatut.EN_ATTENTE);
        } else {
            // RÉSERVATION PAYANTE (DIRECTE) : un acompte = une fraction du loyer qui
            // bloque le logement proportionnellement (10% du loyer => 3 jours, etc.).
            BigDecimal loyer = logement.getPrix() != null ? logement.getPrix() : BigDecimal.ZERO;
            BigDecimal caution = logement.getCaution() != null ? logement.getCaution() : BigDecimal.ZERO;
            BigDecimal acompte = request.getMontantPaye() != null ? request.getMontantPaye() : BigDecimal.ZERO;

            // Un logement déjà réservé (blocage en cours) ne peut pas être re-réservé.
            if (!estReservable(logement)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Ce logement est déjà réservé. Réessayez après la date limite de la réservation en cours.");
            }
            if (acompte.signum() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Un acompte de réservation est requis pour réserver ce logement.");
            }

            int joursBloques = joursDeBlocage(acompte, loyer);

            // Montant total à régler pour transformer la réservation en location : loyer + caution.
            builder.montantTotal(loyer.add(caution));
            builder.montantPaye(acompte);
            // Une réservation payante est d'abord une DEMANDE EN ATTENTE : le propriétaire
            // doit l'ACCEPTER avant que le logement soit réellement réservé/bloqué et que le
            // locataire puisse compléter le paiement (« Compléter » / « Louer la maison »).
            // Tant qu'elle est EN_ATTENTE, le logement reste visible et libre dans l'exploration.
            builder.statut(ReservationStatut.EN_ATTENTE);
            builder.dateExpiration(java.time.LocalDateTime.now().plusDays(joursBloques));
        }

        Reservation saved = reservationRepository.save(builder.build());

        notificationService.notifierCreation(saved);

        return saved;
    }

    /**
     * Nombre de jours de blocage acheté par l'acompte, proportionnel au loyer
     * mensuel : payer 10% d'un loyer bloque 3 jours (30 jours × 10%), 20% => 6 jours…
     * Borné à [1, 30] jours.
     */
    private int joursDeBlocage(BigDecimal acompte, BigDecimal loyer) {
        if (loyer == null || loyer.signum() <= 0) {
            return 3; // loyer inconnu : blocage minimal par défaut
        }
        double fraction = acompte.doubleValue() / loyer.doubleValue();      // ex. 0.10
        int jours = (int) Math.ceil(fraction * 30.0);                       // ex. 3
        return Math.max(1, Math.min(jours, 30));
    }

    /**
     * Vérifie que la date/heure demandée tombe dans un créneau de visite proposé.
     * <ul>
     *   <li>Si le logement n'a AUCUN créneau, le propriétaire n'impose rien : on accepte.</li>
     *   <li>Sinon il faut un créneau disponible dont l'intervalle de dates
     *       [dateCreneau .. dateFin] contient la date et dont la plage horaire
     *       [heureDebut .. heureFin] contient l'heure demandée.</li>
     * </ul>
     */
    private boolean dansUnCreneau(Long logementId, java.time.LocalDate date, String heure) {
        List<com.example.demo.model.Creneau> creneaux =
                creneauRepository.findByLogementIdOrderByDateCreneauAsc(logementId);
        if (creneaux.isEmpty()) {
            return true; // aucune restriction définie
        }
        if (date == null) {
            return false;
        }
        String h = (heure != null && heure.length() >= 5) ? heure.substring(0, 5) : heure;
        for (com.example.demo.model.Creneau c : creneaux) {
            if (Boolean.FALSE.equals(c.getDisponible())) continue;
            java.time.LocalDate debut = c.getDateCreneau();
            java.time.LocalDate fin = c.getDateFin() != null ? c.getDateFin() : c.getDateCreneau();
            if (debut == null || date.isBefore(debut) || date.isAfter(fin)) continue;
            // Plage horaire : comparaison lexicographique sur "HH:MM" (24h zéro-paddé).
            String hd = c.getHeureDebut(), hf = c.getHeureFin();
            if (hd != null && hf != null && !hd.isBlank() && !hf.isBlank()) {
                if (h == null || h.compareTo(hd) < 0 || h.compareTo(hf) > 0) continue;
            }
            return true;
        }
        return false;
    }

    /**
     * Un logement est réservable s'il n'a aucune réservation payante DÉJÀ ACCEPTÉE et
     * active (non expirée). Les simples DEMANDES en attente (EN_ATTENTE) ne bloquent pas :
     * plusieurs locataires peuvent demander le même logement, le propriétaire en accepte une.
     */
    private boolean estReservable(com.example.demo.model.Logement logement) {
        LocalDateTime now = LocalDateTime.now();
        return reservationRepository.findByLogementId(logement.getId()).stream()
                .noneMatch(r -> r.getTypeReservation() == TypeReservation.DIRECTE
                        && r.getStatut() != ReservationStatut.ANNULE
                        && r.getStatut() != ReservationStatut.ANNULE_REFUSE
                        && r.getStatut() != ReservationStatut.EN_ATTENTE
                        && (r.getDateExpiration() == null || r.getDateExpiration().isAfter(now)));
    }

    @Override
    @Transactional
    public Reservation completerReservation(Long reservationId, BigDecimal montantComplement, Users etudiant) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new com.example.demo.exceptions.ResourceNotFoundException("Réservation introuvable"));
        if (!res.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette réservation ne vous appartient pas");
        }
        if (res.getTypeReservation() != TypeReservation.DIRECTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seules les réservations payantes peuvent être complétées");
        }
        BigDecimal dejaPaye = res.getMontantPaye() != null ? res.getMontantPaye() : BigDecimal.ZERO;
        BigDecimal complement = montantComplement != null ? montantComplement : BigDecimal.ZERO;
        res.setMontantPaye(dejaPaye.add(complement));

        // Loyer + caution réglés : la réservation passe en attente de VALIDATION DU
        // PROPRIÉTAIRE. C'est cette validation (validerReservationDirecte) qui crée le
        // contrat, rend le logement OCCUPÉ par le nouveau locataire et débloque le
        // paiement du loyer mensuel.
        boolean complet = res.getMontantTotal() != null && res.getMontantPaye().compareTo(res.getMontantTotal()) >= 0;
        if (complet) {
            res.setStatut(ReservationStatut.EN_ATTENTE_VALIDATION_PROPRIO);
            res.setDateExpiration(null); // plus d'expiration : paiement complet
            res.setConfirmeParEtudiant(true);
        }
        Reservation saved = reservationRepository.save(res);
        // Le paiement est complet : prévenir le propriétaire qu'une réservation attend sa
        // validation (centre de notifications + temps réel + SMS).
        if (complet) {
            try { notificationService.notifierReservationAValider(saved); } catch (Exception ignored) { }
        }
        return saved;
    }

    @Override
    @Transactional
    public Reservation confirmerReservation(Long reservationId, String role, Users appelant) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new com.example.demo.exceptions.ResourceNotFoundException("Réservation introuvable"));
        
        if ("ETUDIANT".equalsIgnoreCase(role)) {
            if (!res.getEtudiant().getId().equals(appelant.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette réservation ne vous appartient pas");
            }
            if (res.getTypeReservation() == TypeReservation.DIRECTE && !isPaiementComplet(res)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paiement incomplet pour confirmer ce logement");
            }
            res.setConfirmeParEtudiant(true);
        } else if ("PROPRIETAIRE".equalsIgnoreCase(role)) {
            if (!res.getLogement().getProprietaire().getId().equals(appelant.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'êtes pas le propriétaire de ce logement");
            }
            res.setConfirmeParProprietaire(true);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rôle invalide");
        }

        // Si les deux ont confirmé, on finalise
        if (res.isConfirmeParEtudiant() && res.isConfirmeParProprietaire()) {
            return workflowService.finaliserReservation(res);
        }

        return reservationRepository.save(res);
    }

    @Override
    @Transactional
    public Reservation confirmerApresVisite(Long reservationId) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Réservation introuvable"));

        if (res.getStatut() != ReservationStatut.VISITE_PLANIFIEE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La visite doit d'abord être planifiée (statut VISITE_PLANIFIEE)");
        }

        ReservationStatut ancienStatut = res.getStatut();
        res.setVisiteConfirmee(true);

        if (res.getTypeReservation() == TypeReservation.DIRECTE) {
            res.setStatut(ReservationStatut.ATTENTE_PAIEMENT);
        } else {
            res.setStatut(ReservationStatut.EN_ATTENTE_VALIDATION_PROPRIO);
        }

        Reservation saved = reservationRepository.save(res);
        notificationService.notifierChangementStatut(saved, ancienStatut);
        return saved;
    }

    @Override
    @Transactional
    public Reservation validerReservationDirecte(Long reservationId) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Réservation introuvable"));

        if (res.getTypeReservation() != TypeReservation.DIRECTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cette méthode est réservée aux réservations directes");
        }
        // Le propriétaire ne peut valider (→ contrat) qu'APRÈS que le locataire a complété
        // son paiement / cliqué « Louer la maison » (statut EN_ATTENTE_VALIDATION_PROPRIO).
        // Sur un simple LOGEMENT_RESERVE (réservation acceptée mais pas encore complétée par
        // le locataire), la validation est refusée : on attend l'action du locataire.
        if (res.getStatut() != ReservationStatut.ATTENTE_PAIEMENT &&
            res.getStatut() != ReservationStatut.EN_ATTENTE_VALIDATION_PROPRIO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La réservation doit d'abord être complétée par le locataire avant validation.");
        }

        relacherPaiements(res);

        return workflowService.finaliserReservation(res);
    }

    private void relacherPaiements(Reservation res) {
        // À la validation de la réservation, TOUS les paiements en cours (séquestre OU
        // en attente : espèces, virement…) passent à VALIDÉ et sont vus comme tels dans
        // l'historique de paiement de l'étudiant.
        List<Paiement> paiements = paiementRepo.findByReservationId(res.getId());
        BigDecimal totalPaye = BigDecimal.ZERO;
        for (Paiement p : paiements) {
            if (p.getStatut() == StatutPaiement.SEQUESTRE || p.getStatut() == StatutPaiement.EN_ATTENTE) {
                p.setStatut(StatutPaiement.VALIDE);
                paiementRepo.save(p);
            }
            if (p.getStatut() == StatutPaiement.VALIDE) {
                totalPaye = totalPaye.add(p.getMontant());
            }
        }

        if (res.getMontantTotal() != null && totalPaye.compareTo(res.getMontantTotal()) > 0) {
            BigDecimal tropPerçu = totalPaye.subtract(res.getMontantTotal());
            System.out.println("Trop-perçu de " + tropPerçu + " Ar pour la réservation #" + res.getId() +
                    " — un remboursement doit être initié.");
        }
    }

    /**
     * À l'annulation/refus d'une réservation, ses paiements sont clôturés :
     * ceux encore en attente (ou séquestre) deviennent REFUSÉS, ceux déjà validés
     * deviennent REMBOURSÉS — reflété dans l'historique de paiement de l'étudiant.
     */
    private void marquerPaiementsAnnules(Reservation res) {
        for (Paiement p : paiementRepo.findByReservationId(res.getId())) {
            StatutPaiement s = p.getStatut();
            if (s == StatutPaiement.EN_ATTENTE || s == StatutPaiement.SEQUESTRE) {
                p.setStatut(StatutPaiement.REFUSE);
                paiementRepo.save(p);
            } else if (s == StatutPaiement.VALIDE) {
                p.setStatut(StatutPaiement.REMBOURSE);
                paiementRepo.save(p);
            }
        }
    }

    @Override
    @Transactional
    public Reservation modifierVisite(Long reservationId, java.time.LocalDate dateVisite, String heureVisite, Long proprietaireId) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new com.example.demo.exceptions.ResourceNotFoundException("Réservation introuvable"));
        if (!res.getLogement().getProprietaire().getId().equals(proprietaireId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette réservation ne concerne pas vos logements");
        }
        if (dateVisite != null) res.setDateVisite(dateVisite);
        res.setHeureVisite(heureVisite);
        Reservation saved = reservationRepository.save(res);
        // Prévenir le locataire de la nouvelle date/heure de visite (centre + temps réel + SMS/email).
        try {
            notificationService.notifierModificationVisite(saved);
        } catch (Exception ignored) { }
        return saved;
    }

    @Override
    public List<Reservation> getReservationsByEtudiant(Long etudiantId) {
        return reservationRepository.findByEtudiantId(etudiantId);
    }

    @Override
    public List<Reservation> getReservationsByProprietaire(Long proprietaireId) {
        return reservationRepository.findByLogementProprietaireId(proprietaireId);
    }

    @Override
    @Transactional
    public Reservation updateStatut(Long reservationId, String statut, Users caller) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new com.example.demo.exceptions.ResourceNotFoundException("Réservation introuvable"));
        ReservationStatut nouveauStatut = ReservationStatut.fromValue(statut);
        if (nouveauStatut == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut invalide");
        }

        // ── Autorisation ────────────────────────────────────────────────────────
        // Le locataire peut UNIQUEMENT annuler sa propre réservation ; le propriétaire
        // du logement (ou un admin) gère toutes les transitions (accepter/confirmer/refuser).
        boolean estAdmin = caller.getRole() == com.example.demo.model.enums.UserRole.ADMIN;
        boolean estLeLocataire = res.getEtudiant() != null && res.getEtudiant().getId().equals(caller.getId());
        boolean estLeProprietaire = res.getLogement() != null
                && res.getLogement().getProprietaire() != null
                && res.getLogement().getProprietaire().getId().equals(caller.getId());
        if (estAdmin || estLeProprietaire) {
            // accès complet
        } else if (estLeLocataire) {
            if (nouveauStatut != ReservationStatut.ANNULE) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Vous ne pouvez qu'annuler votre réservation.");
            }
            // Seule une réservation FINALISÉE (confirmée par les DEUX parties → contrat
            // en cours) n'est plus annulable : l'annuler libérerait un logement réellement
            // occupé. Tant que le contrat n'existe pas (une des deux confirmations manque),
            // le locataire garde le droit d'annuler — y compris si le propriétaire a déjà
            // pré-confirmé une visite/réservation.
            if (res.isConfirmeParProprietaire() && res.isConfirmeParEtudiant()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Cette réservation est déjà finalisée (contrat en cours) et ne peut plus être annulée.");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette réservation ne vous concerne pas.");
        }
        res.setStatut(nouveauStatut);
        if (nouveauStatut == ReservationStatut.LOGEMENT_RESERVE) {
            // Le propriétaire ACCEPTE la réservation : soit une demande payante directe
            // (EN_ATTENTE), soit une visite transformée en réservation ferme. Le logement
            // est alors réellement réservé (masqué de l'exploration) et le locataire peut
            // « Compléter » / « Louer la maison ». On prépare le montant à régler
            // (loyer + caution) et une fenêtre de paiement de 7 jours ; passé ce délai la
            // réservation expire et le logement est automatiquement libéré.
            if (res.getMontantTotal() == null) {
                BigDecimal loyer = res.getLogement().getPrix() != null ? res.getLogement().getPrix() : BigDecimal.ZERO;
                BigDecimal caution = res.getLogement().getCaution() != null ? res.getLogement().getCaution() : BigDecimal.ZERO;
                res.setMontantTotal(loyer.add(caution));
            }
            res.setTypeReservation(TypeReservation.DIRECTE);
            res.setDateExpiration(LocalDateTime.now().plusDays(7));
            res.getLogement().setDisponible(false);
            // En acceptant la réservation, le propriétaire valide l'acompte déjà versé :
            // les paiements en cours (séquestre / en attente) passent à VALIDÉ et
            // apparaissent comme tels dans l'historique de paiement (étudiant + propriétaire),
            // même si la réservation n'est pas encore complétée.
            relacherPaiements(res);
        } else if (nouveauStatut == ReservationStatut.ANNULE || nouveauStatut == ReservationStatut.ANNULE_REFUSE) {
            // La réservation tombe : le blocage est levé et le logement redevient
            // disponible pour les autres (l'occupation réelle passe par un contrat, non
            // impacté ici puisque les réservations finalisées ne sont plus annulables).
            res.setDateExpiration(null);
            if (res.getLogement() != null) {
                res.getLogement().setDisponible(true);
            }
            // Les paiements liés passent à REFUSÉ (en attente) / REMBOURSÉ (déjà validés).
            marquerPaiementsAnnules(res);
        }
        Reservation saved = reservationRepository.save(res);

        // Notification à l'étudiant
        try {
            messagingTemplate.convertAndSendToUser(
                saved.getEtudiant().getTelephone(),
                "/queue/notifications",
                java.util.Map.of(
                    "type", "RESERVATION_STATUT_CHANGE",
                    "message", "Le statut de votre réservation pour " + saved.getLogement().getTitre() + " a été mis à jour : " + saved.getStatut(),
                    "reservationId", saved.getId(),
                    "statut", saved.getStatut()
                )
            );
        } catch (Exception e) {
            System.err.println("Erreur notification WebSocket statut reservation : " + e.getMessage());
        }

        return saved;
    }

    private boolean isPaiementComplet(Reservation res) {
        if (res.getMontantTotal() == null || res.getMontantPaye() == null) {
            return false;
        }
        return res.getMontantPaye().compareTo(res.getMontantTotal()) >= 0;
    }

    @Override
    public ReservationResponse toResponse(Reservation r) {
        Users u = r.getEtudiant();
        return ReservationResponse.builder()
                .id(r.getId())
                .logementId(r.getLogement() != null ? r.getLogement().getId() : null)
                .logement(logementService.toResponse(r.getLogement()))
                .etudiant(ProprietaireResponse.builder()
                        .id(u.getId())
                        .nom(u.getNom())
                        .prenom(u.getPrenom())
                        .avatarUrl(u.getAvatarUrl())
                        .telephone(u.getTelephone())
                        .verifie(u.getIsVerified())
                        .build())
                .dateVisite(r.getDateVisite())
                .heureVisite(r.getHeureVisite())
                .statut(r.getStatut())
                .typeReservation(r.getTypeReservation())
                .montantTotal(r.getMontantTotal())
                .montantPaye(r.getMontantPaye())
                .dateExpiration(r.getDateExpiration())
                .confirmeParEtudiant(r.isConfirmeParEtudiant())
                .confirmeParProprietaire(r.isConfirmeParProprietaire())
                .visiteConfirmee(r.isVisiteConfirmee())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
