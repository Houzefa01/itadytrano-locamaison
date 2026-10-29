package com.example.demo.controller;
 
import com.example.demo.dto.*;
import com.example.demo.service.AvisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
 
@RestController
@RequestMapping("/api/v1/avis")
@RequiredArgsConstructor
public class AvisController {
 
    private final AvisService avisService;
    private final com.example.demo.repository.UserRepository userRepo;
 
    @GetMapping("/logement/{logementId}")
    public ResponseEntity<List<AvisResponse>> getAvisLogement(@PathVariable Long logementId) {
        return ResponseEntity.ok(avisService.getAvisLogement(logementId));
    }
 
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AvisResponse> creer(
            @Valid @RequestBody AvisRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(avisService.creer(req, getUserId(ud)));
    }
 
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AvisResponse> modifier(
            @PathVariable Long id,
            @Valid @RequestBody AvisRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(avisService.modifier(id, req, getUserId(ud)));
    }
 
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        avisService.supprimer(id, getUserId(ud));
        return ResponseEntity.noContent().build();
    }
 
    private Long getUserId(UserDetails ud) {
        return userRepo.findByTelephone(ud.getUsername()).orElseThrow().getId();
    }
}
 
