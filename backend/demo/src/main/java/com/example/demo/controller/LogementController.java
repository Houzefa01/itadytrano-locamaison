package com.example.demo.controller;

import com.example.demo.dto.InterestedUserResponse;
import com.example.demo.dto.LogementRequest;
import com.example.demo.dto.LogementResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.LogementService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/logements")
public class LogementController {

    private final LogementService logementService;
    private final com.example.demo.service.RoutingService routingService;
    private final com.example.demo.repository.EtablissementRepository etablissementRepository;
    private final com.example.demo.repository.DisponibiliteHistoriqueRepository dispoHistoRepo;

    public LogementController(LogementService logementService,
                             com.example.demo.service.RoutingService routingService,
                             com.example.demo.repository.EtablissementRepository etablissementRepository,
                             com.example.demo.repository.DisponibiliteHistoriqueRepository dispoHistoRepo) {
        this.logementService = logementService;
        this.routingService = routingService;
        this.etablissementRepository = etablissementRepository;
        this.dispoHistoRepo = dispoHistoRepo;
    }

    /** Historique de disponibilité d'un logement. */
    @GetMapping("/{id}/historique-disponibilite")
    public ResponseEntity<?> historiqueDisponibilite(@PathVariable Long id) {
        return ResponseEntity.ok(dispoHistoRepo.findByLogementIdOrderByDateChangementDesc(id));
    }

    /** Distance/temps de trajet entre un logement et un établissement (OSRM, repli Haversine). */
    @GetMapping("/{id}/distance")
    public ResponseEntity<?> distance(@PathVariable Long id, @RequestParam Long etablissementId) {
        var logement = logementService.getLogementById(id);
        var loc = logement.getLocalisation();
        var etab = etablissementRepository.findById(etablissementId)
            .orElseThrow(() -> new com.example.demo.exceptions.ResourceNotFoundException("Établissement", etablissementId));
        if (loc == null || loc.getLatitude() == null || loc.getLongitude() == null
                || etab.getLatitude() == null || etab.getLongitude() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Coordonnées GPS manquantes"));
        }
        var d = routingService.distance(loc.getLatitude(), loc.getLongitude(), etab.getLatitude(), etab.getLongitude());
        return ResponseEntity.ok(java.util.Map.of(
            "distanceKm", d.distanceKm(),
            "dureeMinutes", d.dureeMinutes(),
            "source", d.source(),
            "etablissement", etab.getNom()
        ));
    }

    @GetMapping("/{id}/interested-users")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<InterestedUserResponse>> getInterestedUsers(@PathVariable Long id) {
        return ResponseEntity.ok(logementService.getInterestedUsers(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_PROPRIETAIRE') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<LogementResponse> addLogement(@Valid @RequestBody LogementRequest request,
                                                        @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(
            logementService.toResponse(logementService.createLogement(request, principal.getUser()))
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<LogementResponse> getLogement(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        com.example.demo.model.Logement logement = logementService.getLogementById(id);

        // Compteur de vues UNIQUES par personne : on n'incrémente qu'à la première
        // vue d'un utilisateur (« u:<id> ») ou d'un visiteur anonyme (« ip:<adresse> »),
        // et jamais pour le propriétaire qui consulte sa propre annonce.
        Long viewerId = principal != null ? principal.getUserId() : null;
        Long ownerId = logement.getProprietaire() != null ? logement.getProprietaire().getId() : null;
        boolean estLeProprietaire = viewerId != null && viewerId.equals(ownerId);
        if (!estLeProprietaire) {
            String viewer = viewerId != null ? ("u:" + viewerId) : ("ip:" + clientIp(httpRequest));
            if (logementService.enregistrerVue(id, viewer)) {
                // Refléter immédiatement la nouvelle vue dans la réponse.
                logement.setVues((logement.getVues() == null ? 0L : logement.getVues()) + 1);
            }
        }
        return ResponseEntity.ok(logementService.toResponse(logement));
    }

    /** Adresse IP de l'appelant (en tenant compte d'un éventuel proxy/reverse-proxy). */
    private static String clientIp(jakarta.servlet.http.HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String addr = req.getRemoteAddr();
        return addr != null ? addr : "inconnu";
    }

    @PatchMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LogementResponse> updateLogement(
            @PathVariable Long id,
            @Valid @RequestBody LogementRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        System.out.println("--- DEBUG UPDATE LOGEMENT " + id + " ---");
        if (principal == null) {
            System.out.println("DEBUG: Principal is NULL");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        com.example.demo.model.Logement logement = logementService.getLogementById(id);
        
        // Vérification de la propriété ou rôle ADMIN
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOwner = logement.getProprietaire().getId().equals(principal.getUser().getId());

        System.out.println("DEBUG: User=" + principal.getUsername() + ", isAdmin=" + isAdmin + ", isOwner=" + isOwner);

        if (!isAdmin && !isOwner) {
            System.out.println("DEBUG: Access Denied - User is neither owner nor admin");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(
            logementService.toResponse(logementService.updateLogement(id, request))
        );
    }

    @GetMapping
    public ResponseEntity<Page<LogementResponse>> getPublishedLogements(
            @RequestParam(required = false) com.example.demo.model.enums.LogementStatut statut,
            @RequestParam(required = false) String quartier,
            @RequestParam(required = false) com.example.demo.model.enums.LogementType type,
            @RequestParam(required = false) Long prixMin,
            @RequestParam(required = false) Long prixMax,
            @RequestParam(required = false) List<com.example.demo.model.enums.AmenityCode> amenities,
            @RequestParam(required = false) Integer nbrPersonnes,
            @RequestParam(required = false) Integer nbrChambres,
            @RequestParam(required = false) Boolean wc,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<LogementResponse> response = logementService
            .getAllPublishedLogements(statut, quartier, type, prixMin, prixMax, amenities, nbrPersonnes, nbrChambres, wc, PageRequest.of(page, size))
            .map(logementService::toResponse);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<Page<LogementResponse>> getMyLogements(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            System.out.println("DEBUG: User " + principal.getUsername() + " is fetching their listings...");
            
            var pageable = PageRequest.of(page, size);
            var entitiesPage = logementService.getLogementsByProprietaire(principal.getUser().getId(), pageable);
            
            // On mappe les entités en DTOs immédiatement (pendant que la transaction est ouverte)
            java.util.List<LogementResponse> dtoList = entitiesPage.getContent().stream()
                .map(logementService::toResponse)
                .toList();
                
            // On reconstruit une Page avec les DTOs déjà chargés
            Page<LogementResponse> response = new org.springframework.data.domain.PageImpl<>(
                dtoList, 
                pageable, 
                entitiesPage.getTotalElements()
            );
                
            System.out.println("DEBUG: Successfully mapped " + dtoList.size() + " listings to DTOs.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("ERROR in getMyLogements: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<com.example.demo.dto.LandlordStatsResponse> getStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(logementService.getLandlordStats(principal.getUser().getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROPRIETAIRE') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        logementService.deleteLogement(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasRole('PROPRIETAIRE') or hasRole('ADMIN')")
    public ResponseEntity<LogementResponse> updateStatut(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        String statutStr = body.get("statut");
        com.example.demo.model.enums.LogementStatut nouveauStatut =
            com.example.demo.model.enums.LogementStatut.valueOf(statutStr);

        // Les annonces ne nécessitent plus de validation par l'admin :
        // un propriétaire peut publier (PUBLIE) son logement directement.
        return ResponseEntity.ok(logementService.toResponse(logementService.updateStatut(id, nouveauStatut)));
    }

    @PatchMapping("/{id}/disponibilite")
    @PreAuthorize("hasRole('PROPRIETAIRE') or hasRole('ADMIN')")
    public ResponseEntity<LogementResponse> updateAvailability(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Boolean> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Boolean disponible = body.get("disponible");
        if (disponible == null) {
            return ResponseEntity.badRequest().build();
        }

        com.example.demo.model.Logement logement = logementService.getLogementById(id);
        
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOwner = logement.getProprietaire().getId().equals(principal.getUser().getId());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(logementService.toResponse(logementService.updateAvailability(id, disponible)));
    }
}
