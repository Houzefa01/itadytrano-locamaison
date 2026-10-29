package com.example.demo.service;
 
import com.example.demo.dto.*;
import com.example.demo.model.*;
import com.example.demo.model.enums.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;
 
@Service
@Transactional
public class PaiementService {
 
    private final PaiementRepository paiementRepo;
    private final LogementRepository logementRepo;
    private final ReservationRepository reservationRepo;
    private final UserRepository userRepo;
    private final ContratRepository contratRepo;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final SmsService smsService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public PaiementService(PaiementRepository paiementRepo,
                           LogementRepository logementRepo,
                           ReservationRepository reservationRepo,
                           UserRepository userRepo,
                           ContratRepository contratRepo,
                           EmailService emailService,
                           NotificationService notificationService,
                           SmsService smsService,
                           @org.springframework.context.annotation.Lazy org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.paiementRepo = paiementRepo;
        this.logementRepo = logementRepo;
        this.reservationRepo = reservationRepo;
        this.userRepo = userRepo;
        this.contratRepo = contratRepo;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.smsService = smsService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Échéancier de loyer du locataire pour un logement : un mois par échéance,
     * depuis le début du contrat actif, indiquant ceux déjà réglés. Permet au
     * locataire de payer à tout moment les loyers non encore payés, et plusieurs
     * mois à l'avance.
     */
    @Transactional(readOnly = true)
    public List<com.example.demo.dto.EcheanceResponse> getEcheancier(Long logementId, Long etudiantId) {
        java.util.List<Contrat> contrats = contratRepo.findByEtudiantIdAndLogementId(etudiantId, logementId);
        Contrat contrat = contrats.stream()
            .filter(c -> c.getStatut() == StatutContrat.ACTIF)
            .findFirst().orElse(contrats.stream().findFirst().orElse(null));
        if (contrat == null) {
            return List.of();
        }

        // Horizon de l'échéancier : on affiche les mois écoulés/réglés ET au moins
        // 6 mois à venir au-delà de la fin du bail (qui suit les loyers payés), avec
        // un minimum de 12 lignes — pour pouvoir toujours payer des mois à l'avance.
        java.time.LocalDate debutMois = contrat.getDateDebut().withDayOfMonth(1);
        java.time.LocalDate finBail = contrat.getDateFin() != null
            ? contrat.getDateFin().withDayOfMonth(1) : debutMois.plusMonths(12);
        java.time.LocalDate horizon = finBail.plusMonths(6);
        long span = java.time.temporal.ChronoUnit.MONTHS.between(debutMois, horizon);
        int duree = (int) Math.max(12, span);
        java.math.BigDecimal loyer = java.math.BigDecimal.valueOf(
            contrat.getLoyerMensuel() != null ? contrat.getLoyerMensuel() : 0L);

        // Paiements de loyer du locataire pour ce logement (hors refusés).
        java.util.List<Paiement> loyers = paiementRepo
            .findByEtudiantIdAndLogementIdAndTypePaiement(etudiantId, logementId, TypePaiement.LOYER_MENSUEL)
            .stream().filter(p -> p.getStatut() != StatutPaiement.REFUSE).toList();

        java.time.format.DateTimeFormatter fmt =
            java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy", java.util.Locale.FRENCH);

        java.util.List<com.example.demo.dto.EcheanceResponse> echeances = new java.util.ArrayList<>();
        java.time.LocalDate mois = contrat.getDateDebut().withDayOfMonth(1);
        for (int i = 0; i < duree; i++) {
            final java.time.LocalDate m = mois;
            Paiement couvrant = loyers.stream()
                .filter(p -> moisCouvert(p, m))
                .findFirst().orElse(null);
            echeances.add(com.example.demo.dto.EcheanceResponse.builder()
                .mois(m.toString().substring(0, 7))
                .libelle(m.format(fmt))
                .periode(m)
                .montant(loyer)
                .paye(couvrant != null)
                .statut(couvrant != null ? couvrant.getStatut().name() : null)
                .build());
            mois = mois.plusMonths(1);
        }
        return echeances;
    }

    /** Un paiement de loyer couvre-t-il le mois donné (via periodeDebut..periodeFin) ? */
    private boolean moisCouvert(Paiement p, java.time.LocalDate mois) {
        java.time.LocalDate debut = periodeDebutMois(p);
        java.time.LocalDate finBase = p.getPeriodeFin() != null ? p.getPeriodeFin()
            : (p.getPeriodeDebut() != null ? p.getPeriodeDebut() : p.getDatePaiement());
        if (debut == null || finBase == null) return false;
        java.time.LocalDate fin = finBase.withDayOfMonth(1);
        if (fin.isBefore(debut)) fin = debut;
        return !mois.isBefore(debut) && !mois.isAfter(fin);
    }

    /** Premier jour du mois de début couvert par le paiement (repli sur la date de paiement). */
    private java.time.LocalDate periodeDebutMois(Paiement p) {
        java.time.LocalDate d = p.getPeriodeDebut() != null ? p.getPeriodeDebut() : p.getDatePaiement();
        return d != null ? d.withDayOfMonth(1) : null;
    }

    /**
     * Étend la durée du bail à chaque loyer payé : la date de fin = 1er jour du mois
     * suivant le dernier mois de loyer réglé. Le contrat « suit » donc les paiements.
     */
    /** Dernier mois (1er jour) couvert par les loyers non refusés, ou null. */
    public java.time.LocalDate dernierMoisLoyerPaye(Long logementId, Long etudiantId) {
        return paiementRepo
            .findByEtudiantIdAndLogementIdAndTypePaiement(etudiantId, logementId, TypePaiement.LOYER_MENSUEL)
            .stream()
            .filter(x -> x.getStatut() != StatutPaiement.REFUSE)
            .map(x -> {
                java.time.LocalDate fin = x.getPeriodeFin() != null ? x.getPeriodeFin()
                    : (x.getPeriodeDebut() != null ? x.getPeriodeDebut() : x.getDatePaiement());
                return fin != null ? fin.withDayOfMonth(1) : null;
            })
            .filter(java.util.Objects::nonNull)
            .max(java.time.LocalDate::compareTo)
            .orElse(null);
    }

    private void etendreContratSiLoyer(Paiement p) {
        if (p.getTypePaiement() != TypePaiement.LOYER_MENSUEL) return;
        contratRepo.findByEtudiantIdAndLogementId(p.getEtudiant().getId(), p.getLogement().getId()).stream()
            .filter(c -> c.getStatut() == StatutContrat.ACTIF)
            .findFirst()
            .ifPresent(c -> {
                java.time.LocalDate dernierMois = dernierMoisLoyerPaye(p.getLogement().getId(), p.getEtudiant().getId());
                if (dernierMois == null) return;
                // La fin du bail suit le dernier loyer payé : fin = dernier mois + 1.
                java.time.LocalDate nouvelleFin = dernierMois.plusMonths(1);
                if (!nouvelleFin.equals(c.getDateFin())) {
                    c.setDateFin(nouvelleFin);
                    java.time.LocalDate debut = c.getDateDebut() != null
                        ? c.getDateDebut().withDayOfMonth(1) : nouvelleFin;
                    long mois = java.time.temporal.ChronoUnit.MONTHS.between(debut, nouvelleFin);
                    c.setDureeMois((int) Math.max(1, mois));
                    contratRepo.save(c);
                }
            });
    }

    /**
     * Le locataire a-t-il déjà réglé le loyer du mois courant ou d'un mois à venir
     * pour ce logement ? Sert à protéger le locataire : le bailleur ne peut pas
     * libérer un logement dont le mois en cours (ou d'avance) est déjà payé.
     * Tout paiement de loyer non refusé compte (validé, séquestre ou en attente).
     */
    @Transactional(readOnly = true)
    public boolean loyerCouvreMoisCourantOuFutur(Long logementId, Long etudiantId) {
        java.time.LocalDate moisCourant = java.time.LocalDate.now().withDayOfMonth(1);
        return paiementRepo
            .findByEtudiantIdAndLogementIdAndTypePaiement(etudiantId, logementId, TypePaiement.LOYER_MENSUEL)
            .stream()
            .filter(p -> p.getStatut() != StatutPaiement.REFUSE)
            .anyMatch(p -> moisCouvert(p, moisCourant));
    }

    /**
     * Au démarrage d'un bail, le loyer déjà réglé via la réservation (acompte crédité au
     * loyer) doit compter comme le PREMIER MOIS de loyer. Si aucun paiement de loyer ne
     * couvre encore le 1er mois du contrat, on reclasse le premier acompte de réservation
     * (non refusé) en loyer du premier mois — sans créer d'argent en double — pour que
     * l'échéancier affiche ce mois comme payé (cas d'un logement sans caution soldé à 100%).
     */
    @Transactional
    public void crediterPremierMoisLoyer(Reservation reservation, java.time.LocalDate dateDebut) {
        if (reservation == null || dateDebut == null) return;
        java.time.LocalDate mois1 = dateDebut.withDayOfMonth(1);
        List<Paiement> paiements = paiementRepo.findByReservationId(reservation.getId());
        boolean loyerMois1Present = paiements.stream()
            .filter(p -> p.getTypePaiement() == TypePaiement.LOYER_MENSUEL)
            .filter(p -> p.getStatut() != StatutPaiement.REFUSE)
            .anyMatch(p -> moisCouvert(p, mois1));
        if (loyerMois1Present) return; // déjà couvert (ex. flux « Compléter » avec caution)
        paiements.stream()
            .filter(p -> p.getTypePaiement() == TypePaiement.ACOMPTE_RESERVATION)
            .filter(p -> p.getStatut() != StatutPaiement.REFUSE)
            .findFirst()
            .ifPresent(p -> {
                p.setTypePaiement(TypePaiement.LOYER_MENSUEL);
                p.setPeriodeDebut(mois1);
                p.setPeriodeFin(mois1);
                paiementRepo.save(p);
            });
    }

    private void sendSmsSafe(Users u, String message) {
        try {
            if (u != null && u.getTelephone() != null && !u.getTelephone().isBlank()) {
                smsService.sendSms(new SmsRequest(u.getTelephone(), "LocaMaison : " + message));
            }
        } catch (Exception ignored) { }
    }
 
    public PaiementResponse creer(PaiementRequest req, Long etudiantId) {
        Users etudiant = userRepo.findById(etudiantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Logement logement = logementRepo.findById(req.getLogementId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // Le locataire ne peut régler qu'avec un mode accepté par le propriétaire.
        // (Ensemble vide en base => tous les modes sont acceptés.)
        java.util.Set<ModePaiement> modesAcceptes = logement.getModesPaiementAcceptes();
        if (modesAcceptes != null && !modesAcceptes.isEmpty() && !modesAcceptes.contains(req.getMode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Mode de paiement non accepté par le propriétaire pour ce logement.");
        }

        Paiement.PaiementBuilder builder = Paiement.builder()
            .etudiant(etudiant).logement(logement)
            .montant(req.getMontant())
            .typePaiement(req.getTypePaiement())
            .mode(req.getMode())
            .datePaiement(req.getDatePaiement())
            .periodeDebut(req.getPeriodeDebut())
            .periodeFin(req.getPeriodeFin())
            .preuveUrl(req.getPreuveUrl())
            .referenceTransaction(req.getReferenceTransaction() != null
                ? req.getReferenceTransaction()
                : "DK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        // Capture électronique (carte / mobile money) → fonds placés SOUS SÉQUESTRE (tiers de confiance).
        // Espèces / virement → EN ATTENTE de confirmation manuelle par le propriétaire.
        builder.statut(req.getMode() == ModePaiement.CARTE || req.getMode() == ModePaiement.MOBILE_MONEY
            ? StatutPaiement.SEQUESTRE : StatutPaiement.EN_ATTENTE);

        if (req.getReservationId() != null) {
            Reservation reservation = reservationRepo.findById(req.getReservationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            if (!reservation.getEtudiant().getId().equals(etudiantId) || !reservation.getLogement().getId().equals(logement.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paiement incohérent avec la réservation");
            }
            builder.reservation(reservation);

            // Paiement électronique d'une réservation payante → fonds sous séquestre.
            // On NE modifie PAS ici le statut/montant de la réservation : le blocage
            // (LOGEMENT_RESERVE) et la complétion vers location sont gérés par le
            // ReservationService (bookVisite / completerReservation), source de vérité.
            if (reservation.getTypeReservation() == TypeReservation.DIRECTE
                    && req.getMode() == ModePaiement.MOBILE_MONEY) {
                builder.statut(StatutPaiement.SEQUESTRE);
            }
        }

        Paiement saved = paiementRepo.save(builder.build());
        // Chaque loyer payé prolonge la durée du contrat (+1 mois après le dernier mois réglé).
        etendreContratSiLoyer(saved);
        PaiementResponse response = toResponse(saved);

        // Notifications Email (non-bloquantes)
        try {
            String messageEtudiant = saved.getStatut() == StatutPaiement.SEQUESTRE
                ? "Votre paiement de " + saved.getMontant() + " Ar a été mis en séquestre. Il sera libéré après validation par le propriétaire."
                : "Votre paiement de " + saved.getMontant() + " Ar a été enregistré avec la référence : " +
                  saved.getReferenceTransaction() + ". Il est en attente de validation par le propriétaire.";

            emailService.sendSimpleMessage(
                etudiant.getEmail(),
                "Confirmation de votre paiement - LocaMaison",
                "Bonjour " + etudiant.getPrenom() + ",\n\n" + messageEtudiant
            );

            String messageProprio = saved.getStatut() == StatutPaiement.SEQUESTRE
                ? "Un nouveau paiement de " + saved.getMontant() + " Ar a été mis en séquestre par " + etudiant.getPrenom() + " " + etudiant.getNom() +
                  " pour votre logement '" + logement.getTitre() + "'. Validez-le pour libérer les fonds."
                : "Un nouveau paiement de " + saved.getMontant() + " Ar a été effectué par " + etudiant.getPrenom() + " " + etudiant.getNom() +
                  " pour votre logement '" + logement.getTitre() + "'.";

            emailService.sendSimpleMessage(
                logement.getProprietaire().getEmail(),
                "Nouveau paiement reçu - LocaMaison",
                "Bonjour " + logement.getProprietaire().getPrenom() + ",\n\n" + messageProprio
            );
        } catch (Exception e) {
            // On loggue l'erreur mais on ne bloque pas la transaction
            System.err.println("Erreur lors de l'envoi des emails de notification : " + e.getMessage());
        }

        // Notifications persistées + temps réel (centre de notifications)
        try {
            String msgEtudiant = saved.getStatut() == StatutPaiement.SEQUESTRE
                ? "Votre paiement de " + saved.getMontant() + " Ar a été mis en séquestre en attente de validation."
                : "Votre paiement de " + saved.getMontant() + " Ar a été enregistré.";
            notificationService.notifier(etudiant, "PAIEMENT_ENREGISTRE", msgEtudiant);
            notificationService.notifier(logement.getProprietaire(), "PAIEMENT_RECU",
                "Nouveau paiement de " + saved.getMontant() + " Ar pour " + logement.getTitre());
            sendSmsSafe(etudiant, msgEtudiant);
            sendSmsSafe(logement.getProprietaire(), "paiement de " + saved.getMontant() + " Ar reçu pour « " + logement.getTitre() + " ».");
        } catch (Exception e) {
            System.err.println("Erreur notification paiement : " + e.getMessage());
        }
 
        return response;
    }
 
    public PaiementResponse changerStatut(Long id, StatutPaiement statut, Long proprietaireId) {
        Paiement paiement = paiementRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!paiement.getLogement().getProprietaire().getId().equals(proprietaireId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez valider que les paiements de vos logements");
        }
        paiement.setStatut(statut);
        Paiement saved = paiementRepo.save(paiement);
        synchroniserReservationDirecte(saved);
        PaiementResponse response = toResponse(saved);

        // Notification Email à l'étudiant sur le changement de statut (non-bloquant)
        try {
            String message = statut == StatutPaiement.VALIDE 
                ? "Votre paiement a été validé avec succès."
                : "Votre paiement a été refusé. Veuillez contacter le support.";

            emailService.sendSimpleMessage(
                saved.getEtudiant().getEmail(),
                "Mise à jour de votre paiement - LocaMaison",
                "Bonjour " + saved.getEtudiant().getPrenom() + ",\n\n" + message + 
                "\nRéférence : " + saved.getReferenceTransaction()
            );
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'email de mise à jour de statut : " + e.getMessage());
        }

        // Notification persistée + temps réel à l'étudiant
        try {
            notificationService.notifier(saved.getEtudiant(), "PAIEMENT_STATUT_CHANGE",
                statut == StatutPaiement.VALIDE ? "Votre paiement a été validé." : "Votre paiement a été refusé.");
            sendSmsSafe(saved.getEtudiant(), statut == StatutPaiement.VALIDE ? "votre paiement a été validé." : "votre paiement a été refusé.");
        } catch (Exception e) {
            System.err.println("Erreur notification statut paiement : " + e.getMessage());
        }

        return response;
    }

    /**
     * Confirmation d'un paiement par la passerelle (webhook). Le fournisseur
     * (Orange Money / Mvola...) rappelle le serveur avec la référence et le
     * statut réel de la transaction. On met à jour le paiement et on déclenche
     * la synchronisation (libération de séquestre, etc.).
     */
    @Transactional
    public PaiementResponse confirmerViaWebhook(String reference, boolean succes) {
        Paiement paiement = paiementRepo.findByReferenceTransaction(reference)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Référence inconnue"));
        paiement.setStatut(succes ? StatutPaiement.VALIDE : StatutPaiement.REFUSE);
        Paiement saved = paiementRepo.save(paiement);
        synchroniserReservationDirecte(saved);
        try {
            notificationService.notifier(saved.getEtudiant(), "PAIEMENT_STATUT_CHANGE",
                succes ? "Votre paiement a été confirmé par l'opérateur." : "Votre paiement a échoué.");
            sendSmsSafe(saved.getEtudiant(), succes ? "paiement confirmé." : "paiement échoué.");
        } catch (Exception ignored) { }
        return toResponse(saved);
    }

    /** Remboursement d'un paiement (propriétaire du logement ou admin). */
    @Transactional
    public PaiementResponse rembourser(Long id, Long demandeurId, boolean estAdmin) {
        Paiement paiement = paiementRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!estAdmin && !paiement.getLogement().getProprietaire().getId().equals(demandeurId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez rembourser que les paiements de vos logements");
        }
        if (paiement.getStatut() == StatutPaiement.REMBOURSE) {
            return toResponse(paiement);
        }
        paiement.setStatut(StatutPaiement.REMBOURSE);
        Paiement saved = paiementRepo.save(paiement);
        synchroniserReservationDirecte(saved);

        // Rembourser un paiement lié à une réservation NON encore transformée en
        // location => on annule la réservation et on LIBÈRE le logement (il
        // redevient réservable/visible). On ne touche pas à une location déjà
        // finalisée par un contrat actif.
        Reservation res = saved.getReservation();
        if (res != null) {
            boolean contratActif = contratRepo.existsByLogementIdAndStatut(
                    res.getLogement().getId(), StatutContrat.ACTIF);
            if (!contratActif
                    && res.getStatut() != ReservationStatut.ANNULE
                    && res.getStatut() != ReservationStatut.ANNULE_REFUSE) {
                res.setStatut(ReservationStatut.ANNULE);
                res.setDateExpiration(null);
                reservationRepo.save(res);
                res.getLogement().setDisponible(true);
                logementRepo.save(res.getLogement());
            }
        }

        try {
            notificationService.notifier(saved.getEtudiant(), "PAIEMENT_REMBOURSE",
                "Votre paiement de " + saved.getMontant() + " Ar a été remboursé.");
            sendSmsSafe(saved.getEtudiant(), "votre paiement de " + saved.getMontant() + " Ar a été remboursé.");
        } catch (Exception ignored) { }
        return toResponse(saved);
    }

    /** Solde du bailleur : encaissements validés − remboursements (Ariary). */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getSoldeBailleur(Long proprietaireId) {
        java.util.List<Paiement> recus = paiementRepo.findByLogementProprietaireId(proprietaireId);
        java.math.BigDecimal encaisse = recus.stream()
            .filter(p -> p.getStatut() == StatutPaiement.VALIDE)
            .map(Paiement::getMontant).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal sequestre = recus.stream()
            .filter(p -> p.getStatut() == StatutPaiement.SEQUESTRE)
            .map(Paiement::getMontant).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal rembourse = recus.stream()
            .filter(p -> p.getStatut() == StatutPaiement.REMBOURSE)
            .map(Paiement::getMontant).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.util.Map<String, Object> solde = new java.util.LinkedHashMap<>();
        solde.put("disponible", encaisse);       // validé, retirable
        solde.put("enSequestre", sequestre);      // en attente de validation/déblocage
        solde.put("rembourse", rembourse);
        return solde;
    }

    private void synchroniserReservationDirecte(Paiement paiement) {
        Reservation reservation = paiement.getReservation();
        if (reservation == null || reservation.getTypeReservation() != TypeReservation.DIRECTE) {
            return;
        }

        // Cumuler tous les paiements VALIDE (hors séquestre)
        java.math.BigDecimal montantValide = paiementRepo
            .findByReservationIdAndStatut(reservation.getId(), StatutPaiement.VALIDE)
            .stream()
            .map(Paiement::getMontant)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        if (reservation.getMontantTotal() != null && montantValide.compareTo(reservation.getMontantTotal()) > 0) {
            montantValide = reservation.getMontantTotal();
        }

        // Ne jamais diminuer le montant déjà enregistré (l'acompte de blocage et la
        // complétion sont posés de façon optimiste par ReservationService) : on prend
        // le maximum entre le montant courant et la somme des paiements validés.
        java.math.BigDecimal courant = reservation.getMontantPaye() != null
            ? reservation.getMontantPaye() : java.math.BigDecimal.ZERO;
        reservation.setMontantPaye(courant.max(montantValide));
        reservationRepo.save(reservation);
    }
 
    @Transactional(readOnly = true)
    public List<PaiementResponse> getMesPaiements(Long etudiantId) {
        return paiementRepo.findByEtudiantIdOrderByCreatedAtDesc(etudiantId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PaiementResponse> getPaiementsRecus(Long proprietaireId) {
        return paiementRepo.findByLogementProprietaireId(proprietaireId)
            .stream().map(this::toResponse).toList();
    }
 
    @Transactional(readOnly = true)
    public List<PaiementResponse> getPaiementsLogement(Long logementId, Long proprietaireId) {
        Logement logement = logementRepo.findById(logementId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!logement.getProprietaire().getId().equals(proprietaireId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return paiementRepo.findByLogementIdOrderByCreatedAtDesc(logementId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PaiementResponse> getAllPaiements(StatutPaiement statut) {
        if (statut != null) {
            return paiementRepo.findByStatutOrderByCreatedAtDesc(statut)
                .stream().map(this::toResponse).toList();
        }
        return paiementRepo.findAllByOrderByCreatedAtDesc()
            .stream().map(this::toResponse).toList();
    }
 
    private PaiementResponse toResponse(Paiement p) {
        Users e = p.getEtudiant();
        Users b = p.getLogement() != null ? p.getLogement().getProprietaire() : null;
        return PaiementResponse.builder()
            .id(p.getId())
            .etudiant(ProprietaireResponse.builder()
                .id(e.getId()).nom(e.getNom()).prenom(e.getPrenom())
                .telephone(e.getTelephone()).avatarUrl(e.getAvatarUrl()).build())
            .bailleur(b == null ? null : ProprietaireResponse.builder()
                .id(b.getId()).nom(b.getNom()).prenom(b.getPrenom())
                .telephone(b.getTelephone()).avatarUrl(b.getAvatarUrl()).build())
            .logementId(p.getLogement().getId())
            .logementTitre(p.getLogement().getTitre())
            .reservationId(p.getReservation() != null ? p.getReservation().getId() : null)
            .montant(p.getMontant())
            .typePaiement(p.getTypePaiement())
            .mode(p.getMode())
            .statut(p.getStatut())
            .referenceTransaction(p.getReferenceTransaction())
            .datePaiement(p.getDatePaiement())
            .periodeDebut(p.getPeriodeDebut())
            .periodeFin(p.getPeriodeFin())
            .createdAt(p.getCreatedAt())
            .build();
    }
}
 
