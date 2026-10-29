package com.example.demo.service;

import com.example.demo.dto.SmsRequest;
import com.example.demo.model.Reservation;
import com.example.demo.model.Users;
import com.example.demo.model.enums.ReservationStatut;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class ReservationNotificationService {

    private final SmsService smsService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public ReservationNotificationService(SmsService smsService,
                                          EmailService emailService,
                                          NotificationService notificationService,
                                          @org.springframework.context.annotation.Lazy org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.smsService = smsService;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Le propriétaire a modifié la date/heure de la visite : on prévient le locataire
     * (centre de notifications persistant + temps réel WebSocket + SMS/email).
     */
    /**
     * Le locataire a complété son paiement / cliqué « Louer la maison » : la réservation
     * attend la validation du propriétaire. On prévient le propriétaire dans son centre de
     * notifications (persistant) + temps réel + SMS, avec un lien vers ses réservations.
     */
    public void notifierReservationAValider(Reservation reservation) {
        Users proprietaire = reservation.getLogement().getProprietaire();
        String titre = reservation.getLogement().getTitre();
        String message = "Une réservation pour « " + titre + " » attend votre validation.";
        try {
            notificationService.notifier(proprietaire, "RESERVATION_A_VALIDER", message, "/proprietaire/reservations");
        } catch (Exception e) {
            System.err.println("Notification réservation à valider échouée : " + e.getMessage());
        }
        if (proprietaire.getTelephone() != null) {
            try {
                smsService.sendSms(new SmsRequest(proprietaire.getTelephone(), "LocaMaison : " + message));
            } catch (Exception e) {
                System.err.println("SMS réservation à valider échoué : " + e.getMessage());
            }
        }
    }

    public void notifierModificationVisite(Reservation reservation) {
        Users etudiant = reservation.getEtudiant();
        String titre = reservation.getLogement().getTitre();
        String quand = reservation.getDateVisite()
                + (reservation.getHeureVisite() != null ? " à " + reservation.getHeureVisite() : "");
        String message = "Le propriétaire a modifié votre visite pour \"" + titre + "\" : le " + quand + ".";

        // Centre de notifications (persistant) + push temps réel — clic renvoie vers les réservations.
        try {
            notificationService.notifier(etudiant, "VISITE_MODIFIEE", message, "/etudiant/reservations");
        } catch (Exception e) {
            System.err.println("Notification modification visite échouée : " + e.getMessage());
        }
        if (etudiant.getTelephone() != null) {
            try {
                smsService.sendSms(new SmsRequest(etudiant.getTelephone(), "LocaMaison : " + message));
            } catch (Exception e) {
                System.err.println("SMS modification visite échoué : " + e.getMessage());
            }
        }
        if (etudiant.getEmail() != null) {
            try {
                emailService.sendSimpleMessage(etudiant.getEmail(),
                    "Visite modifiée - LocaMaison",
                    "Bonjour " + etudiant.getPrenom() + ",\n\n" + message);
            } catch (Exception e) {
                System.err.println("Email modification visite échoué : " + e.getMessage());
            }
        }
    }

    public void notifierCreation(Reservation reservation) {
        Users etudiant = reservation.getEtudiant();
        Users proprietaire = reservation.getLogement().getProprietaire();
        String titre = reservation.getLogement().getTitre();

        try {
            smsService.sendSms(new SmsRequest(etudiant.getTelephone(),
                "LocaMaison : votre demande pour \"" + titre + "\" a été reçue (réf #" + reservation.getId() + ")."));
        } catch (Exception e) {
            System.err.println("SMS création étudiant échoué : " + e.getMessage());
        }
        try {
            smsService.sendSms(new SmsRequest(proprietaire.getTelephone(),
                "LocaMaison : nouvelle demande de réservation #" + reservation.getId() + " pour \"" + titre + "\"."));
        } catch (Exception e) {
            System.err.println("SMS création proprio échoué : " + e.getMessage());
        }
        notifierWebsocket(reservation, "NOUVELLE_RESERVATION",
            "Nouvelle réservation #" + reservation.getId() + " pour \"" + titre + "\".");
    }

    public void notifierChangementStatut(Reservation reservation, ReservationStatut ancienStatut) {
        Users etudiant = reservation.getEtudiant();
        Users proprietaire = reservation.getLogement().getProprietaire();
        String titre = reservation.getLogement().getTitre();
        ReservationStatut nouveauStatut = reservation.getStatut();

        String messageEtudiant = messagePourEtudiant(nouveauStatut, reservation);
        String messageProprio = messagePourProprietaire(nouveauStatut, reservation);

        if (messageEtudiant != null && etudiant.getTelephone() != null) {
            try {
                smsService.sendSms(new SmsRequest(etudiant.getTelephone(), "LocaMaison : " + messageEtudiant));
            } catch (Exception e) {
                System.err.println("SMS étudiant statut échoué : " + e.getMessage());
            }
        }
        if (messageProprio != null && proprietaire.getTelephone() != null) {
            try {
                smsService.sendSms(new SmsRequest(proprietaire.getTelephone(), "LocaMaison : " + messageProprio));
            } catch (Exception e) {
                System.err.println("SMS proprio statut échoué : " + e.getMessage());
            }
        }

        try {
            emailService.sendSimpleMessage(etudiant.getEmail(),
                "Mise à jour de votre réservation - LocaMaison",
                "Bonjour " + etudiant.getPrenom() + ",\n\n" +
                "Le statut de votre réservation pour \"" + titre + "\" est passé à : " + nouveauStatut.getValue() + ".");
        } catch (Exception e) {
            System.err.println("Email étudiant statut échoué : " + e.getMessage());
        }

        notifierWebsocket(reservation, "RESERVATION_STATUT_CHANGE",
            "Statut mis à jour : " + nouveauStatut.getValue() + " pour \"" + titre + "\".");
    }

    private String messagePourEtudiant(ReservationStatut statut, Reservation reservation) {
        String titre = reservation.getLogement().getTitre();
        return switch (statut) {
            case VISITE_PLANIFIEE -> "Votre visite pour \"" + titre + "\" est planifiée au " + reservation.getDateVisite() + ".";
            case ATTENTE_PAIEMENT -> "Paiement requis pour finaliser \"" + titre + "\". Montant : " + reservation.getMontantTotal() + " Ar.";
            case EN_ATTENTE_VALIDATION_PROPRIO -> "Le propriétaire examine votre réservation pour \"" + titre + "\".";
            case LOGEMENT_RESERVE -> "Félicitations ! \"" + titre + "\" vous est réservé.";
            case ANNULE -> "Votre réservation pour \"" + titre + "\" a été annulée.";
            case ANNULE_REFUSE -> "Votre réservation pour \"" + titre + "\" a été refusée.";
            default -> null;
        };
    }

    private String messagePourProprietaire(ReservationStatut statut, Reservation reservation) {
        String titre = reservation.getLogement().getTitre();
        return switch (statut) {
            case VISITE_PLANIFIEE -> "Une visite a été planifiée pour \"" + titre + "\" au " + reservation.getDateVisite() + ".";
            case ATTENTE_PAIEMENT -> "L'étudiant doit finaliser le paiement pour \"" + titre + "\".";
            case LOGEMENT_RESERVE -> "\"" + titre + "\" est maintenant réservé.";
            case ANNULE, ANNULE_REFUSE -> "La réservation pour \"" + titre + "\" a été annulée.";
            default -> null;
        };
    }

    public void notifierExpiration(Reservation reservation) {
        Users etudiant = reservation.getEtudiant();
        String titre = reservation.getLogement().getTitre();

        try {
            smsService.sendSms(new SmsRequest(etudiant.getTelephone(),
                "LocaMaison : votre réservation pour \"" + titre + "\" a expiré et a été annulée."));
        } catch (Exception e) {
            System.err.println("SMS expiration échoué : " + e.getMessage());
        }
        try {
            emailService.sendSimpleMessage(etudiant.getEmail(),
                "Réservation expirée - LocaMaison",
                "Bonjour " + etudiant.getPrenom() + ",\n\n" +
                "Votre réservation pour \"" + titre + "\" a expiré et a été automatiquement annulée.");
        } catch (Exception e) {
            System.err.println("Email expiration échoué : " + e.getMessage());
        }
        notifierWebsocket(reservation, "RESERVATION_EXPIREE",
            "Réservation #" + reservation.getId() + " expirée.");
    }

    private void notifierWebsocket(Reservation reservation, String type, String message) {
        try {
            messagingTemplate.convertAndSendToUser(
                reservation.getEtudiant().getTelephone(),
                "/queue/notifications",
                Map.of("type", type, "message", message, "reservationId", reservation.getId()));
            messagingTemplate.convertAndSendToUser(
                reservation.getLogement().getProprietaire().getTelephone(),
                "/queue/notifications",
                Map.of("type", type, "message", message, "reservationId", reservation.getId()));
        } catch (Exception e) {
            System.err.println("Erreur WebSocket notification : " + e.getMessage());
        }
    }
}
