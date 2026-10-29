package com.example.demo.controller;

import com.example.demo.exceptions.ResourceNotFoundException;
import com.example.demo.model.Notification;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository repo;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Notification>> mine(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(repo.findTop50ByDestinataireIdOrderByCreatedAtDesc(principal.getUser().getId()));
    }

    @GetMapping("/non-lues/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("count", repo.countByDestinataireIdAndLuFalse(principal.getUser().getId())));
    }

    @PatchMapping("/{id}/lu")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<?> markRead(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        Notification n = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        if (!n.getDestinataire().getId().equals(principal.getUser().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        n.setLu(true);
        repo.save(n);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/lu-tout")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        List<Notification> list = repo.findByDestinataireIdOrderByCreatedAtDesc(principal.getUser().getId());
        list.forEach(n -> n.setLu(true));
        repo.saveAll(list);
        return ResponseEntity.ok(Map.of("marquees", list.size()));
    }
}
