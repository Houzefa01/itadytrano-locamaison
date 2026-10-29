package com.example.demo.service;

import com.example.demo.model.Notification;
import com.example.demo.model.Users;
import com.example.demo.repository.NotificationRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Centre de notifications : persiste chaque notification ET la pousse en temps
 * réel via WebSocket (file /queue/notifications de l'utilisateur).
 */
@Service
public class NotificationService {

    private final NotificationRepository repo;
    private final SimpMessagingTemplate ws;

    public NotificationService(NotificationRepository repo, @Lazy SimpMessagingTemplate ws) {
        this.repo = repo;
        this.ws = ws;
    }

    @Transactional
    public Notification notifier(Users destinataire, String type, String message, String lien) {
        Notification n = repo.save(Notification.builder()
                .destinataire(destinataire)
                .type(type)
                .message(message)
                .lien(lien)
                .lu(false)
                .build());
        try {
            ws.convertAndSendToUser(destinataire.getTelephone(), "/queue/notifications", Map.of(
                    "id", n.getId(),
                    "type", type,
                    "message", message,
                    "lien", lien == null ? "" : lien));
        } catch (Exception ignored) {
            // l'échec d'envoi temps réel ne doit pas bloquer la persistance
        }
        return n;
    }

    public Notification notifier(Users destinataire, String type, String message) {
        return notifier(destinataire, type, message, null);
    }
}
