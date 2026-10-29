package com.example.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // Interrupteur global des e-mails. Par défaut DÉSACTIVÉ : toutes les
    // notifications (vérification d'inscription, mot de passe oublié, paiement,
    // réservation, visite…) passent EXCLUSIVEMENT par SMS. Pour réactiver
    // l'e-mail, définir EMAIL_ENABLED=true.
    @org.springframework.beans.factory.annotation.Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    // Envoi asynchrone : l'e-mail (SMTP) ne doit jamais bloquer le flux métier
    // (paiement, réservation…). Best-effort, échec logué sans impact.
    @Async
    public void sendSimpleMessage(String to, String subject, String text) {
        if (!emailEnabled) return; // Notifications par SMS uniquement — e-mail coupé.
        if (to == null || to.isBlank()) return;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("nomenjanaharyflorancia@gmail.com");
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
        System.out.println("E-mail envoyé avec succès à : " + to);
    }

    public void sendWelcomeEmail(String to, String nom) {
        String subject = "Bienvenue sur LocaMaison !";
        String text = String.format(
            "Bonjour %s,\n\n" +
            "Votre compte a été créé avec succès sur LocaMaison.\n" +
            "Vous pouvez désormais vous connecter pour rechercher un logement ou gérer vos annonces.\n\n" +
            "À très bientôt,\n" +
            "L'équipe LocaMaison",
            nom
        );
        sendSimpleMessage(to, subject, text);
    }

    public void sendPasswordResetEmail(String to, String nom, String code) {
        String subject = "Réinitialisation de votre mot de passe LocaMaison";
        String text = String.format(
            "Bonjour %s,\n\n" +
            "Vous avez demandé la réinitialisation de votre mot de passe LocaMaison.\n" +
            "Voici votre code de réinitialisation :\n\n" +
            "      --- %s ---\n\n" +
            "Ce code expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.\n\n" +
            "L'équipe LocaMaison",
            nom,
            code
        );
        sendSimpleMessage(to, subject, text);
    }

    public void sendVerificationEmail(String to, String nom, String token) {
        String subject = "Code d'activation LocaMaison";
        
        String text = String.format(
            "Bonjour %s,\n\n" +
            "Merci de vous être inscrit sur LocaMaison. Voici votre code d'activation :\n\n" +
            "      --- %s ---\n\n" +
            "Veuillez saisir ce code sur l'application pour activer votre compte.\n" +
            "Ce code expirera dans 24 heures.\n\n" +
            "À très bientôt,\n" +
            "L'équipe LocaMaison",
            nom,
            token
        );
        sendSimpleMessage(to, subject, text);
    }
}
