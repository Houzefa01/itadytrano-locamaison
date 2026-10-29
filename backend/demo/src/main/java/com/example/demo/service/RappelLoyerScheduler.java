package com.example.demo.service;

import com.example.demo.model.Contrat;
import com.example.demo.model.Users;
import com.example.demo.dto.SmsRequest;
import com.example.demo.model.enums.StatutContrat;
import com.example.demo.model.enums.StatutPaiement;
import com.example.demo.repository.ContratRepository;
import com.example.demo.repository.PaiementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Rappels de loyer (avant échéance) et alertes de retard de paiement.
 * S'exécute chaque jour ; peut aussi être déclenché manuellement (admin).
 */
@Service
@RequiredArgsConstructor
public class RappelLoyerScheduler {

    private final ContratRepository contratRepo;
    private final PaiementRepository paiementRepo;
    private final NotificationService notificationService;
    private final SmsService smsService;

    @Scheduled(cron = "0 0 8 * * *") // tous les jours à 08h00
    public void executer() {
        traiter();
    }

    @Transactional
    public int traiter() {
        int envoyees = 0;
        LocalDate today = LocalDate.now();

        for (Contrat c : contratRepo.findByStatut(StatutContrat.ACTIF)) {
            if (c.getDateDebut() == null || c.getEtudiant() == null || c.getLogement() == null) continue;

            int dueDay = Math.min(c.getDateDebut().getDayOfMonth(), today.lengthOfMonth());
            LocalDate echeance = today.withDayOfMonth(dueDay);
            long jours = ChronoUnit.DAYS.between(today, echeance);

            if (aPayeCeMois(c, today)) continue;

            String titre = c.getLogement().getTitre();
            if (jours >= 0 && jours <= 3) {
                String msg = "Rappel : votre loyer pour « " + titre + " » est dû le " + echeance + ".";
                notificationService.notifier(c.getEtudiant(), "RAPPEL_LOYER", msg);
                sendSmsSafe(c.getEtudiant(), msg);
                envoyees++;
            } else if (jours < 0) {
                String msg = "Retard : le loyer de « " + titre + " » (échéance " + echeance + ") n'a pas été réglé.";
                notificationService.notifier(c.getEtudiant(), "RETARD_PAIEMENT", msg);
                sendSmsSafe(c.getEtudiant(), msg);
                if (c.getLogement().getProprietaire() != null) {
                    notificationService.notifier(c.getLogement().getProprietaire(), "RETARD_PAIEMENT",
                            "Le locataire de « " + titre + " » est en retard de paiement (échéance " + echeance + ").");
                }
                envoyees++;
            }
        }
        return envoyees;
    }

    private void sendSmsSafe(Users u, String message) {
        try {
            if (u != null && u.getTelephone() != null && !u.getTelephone().isBlank()) {
                smsService.sendSms(new SmsRequest(u.getTelephone(), "LocaMaison : " + message));
            }
        } catch (Exception ignored) { }
    }

    private boolean aPayeCeMois(Contrat c, LocalDate today) {
        return paiementRepo.findByEtudiantId(c.getEtudiant().getId()).stream()
                .anyMatch(p -> p.getStatut() == StatutPaiement.VALIDE
                        && p.getLogement() != null
                        && p.getLogement().getId().equals(c.getLogement().getId())
                        && p.getDatePaiement() != null
                        && p.getDatePaiement().getMonthValue() == today.getMonthValue()
                        && p.getDatePaiement().getYear() == today.getYear());
    }
}
