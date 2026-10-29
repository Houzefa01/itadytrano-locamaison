package com.example.demo.controller;
 
import com.example.demo.dto.*;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.FavorisService;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
 
@RestController
@RequestMapping("/api/v1/favoris")
@RequiredArgsConstructor
public class FavorisController {
 
    private final FavorisService favorisService;
    private final UserRepository userRepository;
 
    @PostMapping("/toggle/{logementId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> toggle(
            @PathVariable Long logementId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean ajout = favorisService.toggleFavori(getUserId(userDetails), logementId);
        return ResponseEntity.ok(Map.of("ajout", ajout));
    }
 
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LogementResponse>> getMesFavoris(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(favorisService.getMesFavoris(getUserId(userDetails)));
    }
 
    @GetMapping("/{logementId}/statut")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> isFavori(
            @PathVariable Long logementId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean fav = favorisService.isFavori(getUserId(userDetails), logementId);
        return ResponseEntity.ok(Map.of("favori", fav));
    }

    private Long getUserId(UserDetails userDetails) {
        if (userDetails instanceof UserPrincipal) {
            return ((UserPrincipal) userDetails).getUserId();
        }
        return userRepository.findByTelephone(userDetails.getUsername())
                .orElseThrow(() -> new com.example.demo.exceptions.ResourceNotFoundException("User not found"))
                .getId();
    }
}
