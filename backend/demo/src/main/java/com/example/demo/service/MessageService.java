package com.example.demo.service;
 
import com.example.demo.dto.*;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
 
@Service
@Transactional
public class MessageService {
 
    private final MessageRepository messageRepo;
    private final UserRepository userRepo;
    private final LogementRepository logementRepo;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public MessageService(MessageRepository messageRepo,
                          UserRepository userRepo,
                          LogementRepository logementRepo,
                          @org.springframework.context.annotation.Lazy org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.logementRepo = logementRepo;
        this.messagingTemplate = messagingTemplate;
    }
 
    public MessageResponse envoyer(MessageRequest req, Long expediteurId) {
        if (expediteurId.equals(req.getDestinataireId()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Vous ne pouvez pas vous envoyer un message à vous-même");
 
        Users expediteur = userRepo.findById(expediteurId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Users destinataire = userRepo.findById(req.getDestinataireId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
 
        Message.MessageBuilder builder = Message.builder()
            .expediteur(expediteur)
            .destinataire(destinataire)
            .contenu(req.getContenu() != null ? req.getContenu() : "")
            .attachmentUrl(req.getAttachmentUrl());
 
        if (req.getLogementId() != null) {
            Logement logement = logementRepo.findById(req.getLogementId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            builder.logement(logement);
        }

        MessageResponse response = toResponse(messageRepo.save(builder.build()));
        
        // Notification temps réel via WebSocket
        messagingTemplate.convertAndSendToUser(
            destinataire.getTelephone(),
            "/queue/messages",
            response
        );

        return response;
    }
 
    public List<MessageResponse> getConversation(Long userId, Long autreUserId) {
        messageRepo.marquerLusParConversation(userId, autreUserId);
        return messageRepo.findConversation(userId, autreUserId)
            .stream().map(this::toResponse).toList();
    }
 
    @Transactional(readOnly = true)
    public List<MessageResponse> getDerniersMessages(Long userId) {
        return messageRepo.findDerniersMessages(userId)
            .stream().map(this::toResponse).toList();
    }
 
    @Transactional(readOnly = true)
    public long getNombreNonLus(Long userId) {
        return messageRepo.countByDestinataireIdAndLuFalse(userId);
    }
 
    private MessageResponse toResponse(Message m) {
        return MessageResponse.builder()
            .id(m.getId())
            .expediteurId(m.getExpediteur().getId())
            .expediteur(toProprioResp(m.getExpediteur()))
            .destinataireId(m.getDestinataire().getId())
            .destinataire(toProprioResp(m.getDestinataire()))
            .logementId(m.getLogement() != null ? m.getLogement().getId() : null)
            .contenu(m.getContenu())
            .attachmentUrl(m.getAttachmentUrl())
            .lu(m.getLu())
            .createdAt(m.getCreatedAt())
            .build();
    }
 
    private ProprietaireResponse toProprioResp(Users u) {
        return ProprietaireResponse.builder()
            .id(u.getId()).nom(u.getNom()).prenom(u.getPrenom())
            .telephone(u.getTelephone()).avatarUrl(u.getAvatarUrl())
            .verifie(u.getIsVerified())
            .build();
    }
}
