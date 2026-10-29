package com.example.demo.controller;

import com.example.demo.exceptions.ResourceNotFoundException;
import com.example.demo.model.Reaction;
import com.example.demo.model.enums.ReactionType;
import com.example.demo.repository.LogementRepository;
import com.example.demo.repository.ReactionRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/logements/{logementId}/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionRepository reactionRepo;
    private final UserRepository userRepo;
    private final LogementRepository logementRepo;

    /** Compteurs publics + réaction de l'utilisateur courant (si connecté). */
    @GetMapping
    public ResponseEntity<?> get(@PathVariable Long logementId,
                                 @AuthenticationPrincipal UserPrincipal principal) {
        long likes = reactionRepo.countByLogementIdAndType(logementId, ReactionType.LIKE);
        long dislikes = reactionRepo.countByLogementIdAndType(logementId, ReactionType.DISLIKE);
        String mine = "";
        if (principal != null) {
            mine = reactionRepo.findByUtilisateurIdAndLogementId(principal.getUser().getId(), logementId)
                    .map(r -> r.getType().name()).orElse("");
        }
        return ResponseEntity.ok(Map.of("likes", likes, "dislikes", dislikes, "maReaction", mine));
    }

    /** Pose / bascule / retire une réaction. Corps : { "type": "LIKE" | "DISLIKE" }. */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<?> react(@PathVariable Long logementId,
                                   @RequestBody Map<String, String> body,
                                   @AuthenticationPrincipal UserPrincipal principal) {
        ReactionType type = ReactionType.valueOf(body.get("type"));
        Long userId = principal.getUser().getId();

        var existing = reactionRepo.findByUtilisateurIdAndLogementId(userId, logementId);
        if (existing.isPresent()) {
            Reaction r = existing.get();
            if (r.getType() == type) {
                reactionRepo.delete(r);          // même réaction => on l'enlève
            } else {
                r.setType(type);                 // réaction différente => on bascule
                reactionRepo.save(r);
            }
        } else {
            var logement = logementRepo.findById(logementId)
                    .orElseThrow(() -> new ResourceNotFoundException("Logement", logementId));
            reactionRepo.save(Reaction.builder()
                    .utilisateur(userRepo.findById(userId).orElseThrow())
                    .logement(logement)
                    .type(type)
                    .build());
        }

        return ResponseEntity.ok(Map.of(
                "likes", reactionRepo.countByLogementIdAndType(logementId, ReactionType.LIKE),
                "dislikes", reactionRepo.countByLogementIdAndType(logementId, ReactionType.DISLIKE)));
    }
}
