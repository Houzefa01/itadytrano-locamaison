package com.example.demo.service.impl;
import com.example.demo.dto.*;
import com.example.demo.model.Localisation;
import com.example.demo.model.Logement;
import com.example.demo.model.Users;
import com.example.demo.model.enums.AmenityCode;
import com.example.demo.model.enums.LogementStatut;
import com.example.demo.repository.*;
import com.example.demo.service.LogementService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class LogementServiceImpl implements LogementService {

    private final LogementRepository logementRepository;
    private final LocalisationRepository localisationRepository;
    private final MessageRepository messageRepository;
    private final FavoriRepository favoriRepository;
    private final ReservationRepository reservationRepository;
    private final DisponibiliteHistoriqueRepository dispoHistoRepo;
    private final LogementVueRepository logementVueRepository;
    private final ContratRepository contratRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public LogementServiceImpl(LogementRepository logementRepository,
                               LocalisationRepository localisationRepository,
                               MessageRepository messageRepository,
                               FavoriRepository favoriRepository,
                               ReservationRepository reservationRepository,
                               DisponibiliteHistoriqueRepository dispoHistoRepo,
                               LogementVueRepository logementVueRepository,
                               ContratRepository contratRepository,
                               @org.springframework.context.annotation.Lazy SimpMessagingTemplate messagingTemplate) {
        this.logementRepository = logementRepository;
        this.localisationRepository = localisationRepository;
        this.messageRepository = messageRepository;
        this.favoriRepository = favoriRepository;
        this.reservationRepository = reservationRepository;
        this.dispoHistoRepo = dispoHistoRepo;
        this.logementVueRepository = logementVueRepository;
        this.contratRepository = contratRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public com.example.demo.dto.LandlordStatsResponse getLandlordStats(Long proprietaireId) {
        long active = logementRepository.countByProprietaireIdAndStatut(proprietaireId, LogementStatut.PUBLIE);
        long pending = logementRepository.countByProprietaireIdAndStatut(proprietaireId, LogementStatut.EN_ATTENTE);
        long total = logementRepository.countByProprietaireId(proprietaireId);
        long inquiries = messageRepository.countByDestinataireIdAndLuFalse(proprietaireId);
        long pendingReservations = reservationRepository.countByLogementProprietaireIdAndStatut(proprietaireId, com.example.demo.model.enums.ReservationStatut.EN_ATTENTE);
        long totalViews = logementRepository.sumVuesByProprietaireId(proprietaireId);

        return com.example.demo.dto.LandlordStatsResponse.builder()
                .activeListingsCount(active)
                .pendingListingsCount(pending)
                .totalListingsCount(total)
                .inquiriesCount(inquiries)
                .pendingReservationsCount(pendingReservations)
                .totalViews(totalViews)
                .build();
    }

    @Override
    public Logement createLogement(LogementRequest request, Users proprietaire) {
        Set<AmenityCode> amenities = request.getAmenities() != null
            ? new HashSet<>(request.getAmenities())
            : new HashSet<>();

        Logement logement = Logement.builder()
                .proprietaire(proprietaire)
                .titre(safeTrim(request.getTitre()))
                .description(safeTrim(request.getDescription()))
                .prix(request.getPrix())
                .type(request.getType())
                .adresse(safeTrim(request.getAdresse()))
                .quartier(safeTrimOrFallback(request.getQuartier(), request.getAdresse()))
                .amenities(amenities)
                .nbrMaxPersonne(request.getNbrMaxPersonne() != null ? request.getNbrMaxPersonne() : 1)
                .nbrChambres(request.getNbrChambres())
                .wc(Boolean.TRUE.equals(request.getWc()))
                .caution(request.getCaution())
                .avance(request.getAvance())
                .modesPaiementAcceptes(request.getModesPaiement() != null
                    ? new HashSet<>(request.getModesPaiement()) : new HashSet<>())
                .videoUrl(safeTrim(request.getVideoUrl()))
                .eauDistance(safeTrim(request.getEauDistance()))
                .statut(LogementStatut.BROUILLON)
                .build();

        Logement saved = logementRepository.save(logement);

        if (request.getLatitude() != null && request.getLongitude() != null) {
            Localisation localisation = Localisation.builder()
                    .logement(saved)
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .adresseComplete(safeTrim(request.getAdresse()))
                    .ville("Antsiranana")
                    .build();
            localisationRepository.save(localisation);
        }

        return saved;
    }

    /**
     * Un logement est verrouillé (ni modifiable, ni supprimable, ni ouvrable à de
     * nouveaux créneaux) s'il est occupé (contrat ACTIF) ou réservé (le propriétaire
     * a accepté une réservation, ou le locataire l'a complétée et attend la validation).
     */
    @Override
    public boolean estOccupeOuReserve(Long logementId) {
        if (contratRepository.existsByLogementIdAndStatut(
                logementId, com.example.demo.model.enums.StatutContrat.ACTIF)) {
            return true;
        }
        return reservationRepository.existsByLogementIdAndStatutIn(logementId, List.of(
                com.example.demo.model.enums.ReservationStatut.LOGEMENT_RESERVE,
                com.example.demo.model.enums.ReservationStatut.EN_ATTENTE_VALIDATION_PROPRIO));
    }

    @Override
    public Logement updateLogement(Long id, LogementRequest request) {
        Logement logement = getLogementById(id);

        // Un logement occupé ou réservé est figé : interdit de le modifier.
        if (estOccupeOuReserve(id)) {
            throw new com.example.demo.exceptions.ValidationException(
                "Ce logement est occupé ou réservé : il ne peut pas être modifié tant que la location ou la réservation est en cours.");
        }

        logement.setTitre(safeTrim(request.getTitre()));
        logement.setDescription(safeTrim(request.getDescription()));
        logement.setPrix(request.getPrix());
        logement.setType(request.getType());
        logement.setAdresse(safeTrim(request.getAdresse()));
        logement.setQuartier(safeTrimOrFallback(request.getQuartier(), request.getAdresse()));
        logement.setNbrMaxPersonne(request.getNbrMaxPersonne() != null ? request.getNbrMaxPersonne() : 1);
        logement.setNbrChambres(request.getNbrChambres());
        logement.setWc(Boolean.TRUE.equals(request.getWc()));
        logement.setCaution(request.getCaution());
        logement.setAvance(request.getAvance());
        logement.setVideoUrl(safeTrim(request.getVideoUrl()));
        logement.setEauDistance(safeTrim(request.getEauDistance()));

        if (request.getModesPaiement() != null) {
            logement.setModesPaiementAcceptes(new HashSet<>(request.getModesPaiement()));
        }

        if (request.getAmenities() != null) {
            logement.setAmenities(new HashSet<>(request.getAmenities()));
        }

        if (request.getLatitude() != null && request.getLongitude() != null) {
            Localisation loc = logement.getLocalisation();
            if (loc == null) {
                loc = Localisation.builder().logement(logement).build();
            }
            loc.setLatitude(request.getLatitude());
            loc.setLongitude(request.getLongitude());
            loc.setAdresseComplete(safeTrim(request.getAdresse()));
            loc.setVille("Antsiranana");
            localisationRepository.save(loc);
            logement.setLocalisation(loc);
        }

        return logementRepository.save(logement);
    }

    @Override
    public Logement getLogementById(Long id) {
        return logementRepository.findById(id)
                .orElseThrow(() -> new com.example.demo.exceptions.ResourceNotFoundException("Logement introuvable avec l'ID: " + id));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void incrementerVues(Long id) {
        logementRepository.incrementerVues(id);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public boolean enregistrerVue(Long logementId, String viewer) {
        // Insertion atomique : 1 ligne => première vue de cette personne, on compte.
        int inserted = logementVueRepository.enregistrerVue(logementId, viewer);
        if (inserted > 0) {
            logementRepository.incrementerVues(logementId);
            return true;
        }
        return false;
    }

    @Override
    public Page<Logement> getAllPublishedLogements(
            LogementStatut statut,
            String quartier,
            com.example.demo.model.enums.LogementType type,
            Long prixMin,
            Long prixMax,
            List<AmenityCode> amenities,
            Integer nbrPersonnes,
            Integer nbrChambres,
            Boolean wc,
            Pageable pageable) {

        // Si aucun filtre n'est présent (sauf statut), on utilise la méthode simple.
        // Les logements occupés (disponible=false) ne sont PAS exposés au public :
        // ils restent visibles pour le propriétaire (Mes logements) et pour leur
        // occupant (via ses contrats/réservations), mais pas dans les annonces.
        if (quartier == null && type == null && prixMin == null && prixMax == null && (amenities == null || amenities.isEmpty()) && nbrPersonnes == null && nbrChambres == null && wc == null) {
            if (statut != null) {
                return statut == LogementStatut.PUBLIE
                        ? logementRepository.findByStatutAndDisponibleTrue(statut, pageable)
                        : logementRepository.findByStatut(statut, pageable);
            }
            return logementRepository.findAll(pageable);
        }

        // Sinon on utilise la recherche avancée
        long amenitiesCount = (amenities == null) ? 0 : amenities.size();
        return logementRepository.search(statut, quartier, type, prixMin, prixMax, amenities, amenitiesCount, nbrPersonnes, nbrChambres, wc, pageable);
    }

    @Override
    public Page<Logement> getLogementsByProprietaire(Long proprietaireId, Pageable pageable) {
        return logementRepository.findByProprietaireId(proprietaireId, pageable);
    }

    @Override
    public void deleteLogement(Long id) {
        // Un logement occupé (contrat ACTIF) ou réservé ne peut pas être supprimé
        // tant que la situation n'est pas dénouée (contrat terminé, réservation annulée).
        if (estOccupeOuReserve(id)) {
            throw new com.example.demo.exceptions.ValidationException(
                "Ce logement est occupé ou réservé : il ne peut pas être supprimé tant que la location ou la réservation est en cours.");
        }
        logementRepository.deleteById(id);
    }

    @Override
    public Logement updateStatut(Long id, LogementStatut statut) {
        Logement logement = getLogementById(id);

        // Vérification : 3 photos minimum pour publier
        if (statut == LogementStatut.PUBLIE) {
            int nbPhotos = (logement.getPhotos() != null) ? logement.getPhotos().size() : 0;
            if (nbPhotos < 3) {
                throw new com.example.demo.exceptions.ValidationException(
                    "Impossible de publier : ajoutez au moins 3 photos (actuellement " + nbPhotos + ").");
            }
        }

        logement.setStatut(statut);
        Logement saved = logementRepository.save(logement);
        dispoHistoRepo.save(com.example.demo.model.DisponibiliteHistorique.builder()
            .logement(saved).statut(saved.getStatut()).disponible(saved.getDisponible()).build());

        // Notification au propriétaire
        messagingTemplate.convertAndSendToUser(
            saved.getProprietaire().getTelephone(),
            "/queue/notifications",
            Map.of(
                "type", "LOGEMENT_STATUS_CHANGED",
                "logementId", saved.getId(),
                "statut", saved.getStatut(),
                "message", "Le statut de votre logement '" + saved.getTitre() + "' a été mis à jour : " + saved.getStatut()
            )
        );

        // Notification aux admins si un logement est soumis (EN_ATTENTE)
        if (statut == LogementStatut.EN_ATTENTE) {
            Object adminPayload = Map.of(
                "type", "NEW_LOGEMENT_SUBMISSION",
                "logementId", saved.getId(),
                "message", "Nouveau logement à valider : " + saved.getTitre()
            );
            messagingTemplate.convertAndSend("/topic/admin/notifications", adminPayload);
        }

        return saved;
    }

    @Override
    public Logement updateAvailability(Long id, boolean disponible) {
        Logement logement = getLogementById(id);
        logement.setDisponible(disponible);
        Logement saved = logementRepository.save(logement);
        dispoHistoRepo.save(com.example.demo.model.DisponibiliteHistorique.builder()
            .logement(saved).statut(saved.getStatut()).disponible(saved.getDisponible()).build());
        return saved;
    }

    @Override
    public LogementResponse toResponse(Logement logement) {
        var localisation = logement.getLocalisation();
        LocalisationResponse localisationResponse = localisation == null ? null
            : LocalisationResponse.builder()
                .id(localisation.getId())
                .latitude(localisation.getLatitude())
                .longitude(localisation.getLongitude())
                .adresseComplete(localisation.getAdresseComplete())
                .ville(localisation.getVille())
                .codePostal(localisation.getCodePostal())
                .distanceCampusKm(localisation.getDistanceCampusKm())
                .lienGoogleMaps(localisation.getLienGoogleMaps())
                .build();

        List<PhotoResponse> photos = logement.getPhotos() == null
            ? List.of()
            : logement.getPhotos().stream()
                .sorted((a, b) -> Integer.compare(
                    a.getOrdre() == null ? 0 : a.getOrdre(),
                    b.getOrdre() == null ? 0 : b.getOrdre()
                ))
                .map(p -> PhotoResponse.builder()
                    .id(p.getId())
                    .url(p.getUrl())
                    .principale(p.getPrincipale())
                    .ordre(p.getOrdre())
                    .build())
                .toList();

        var proprietaire = logement.getProprietaire();
        ProprietaireResponse proprietaireResponse = proprietaire == null ? null
            : ProprietaireResponse.builder()
                .id(proprietaire.getId())
                .nom(proprietaire.getNom())
                .prenom(proprietaire.getPrenom())
                .telephone(proprietaire.getTelephone())
                .avatarUrl(proprietaire.getAvatarUrl())
                .verifie(proprietaire.getIsVerified())
                .build();

        return LogementResponse.builder()
            .id(logement.getId())
            .titre(logement.getTitre())
            .description(logement.getDescription())
            .prix(logement.getPrix())
            .type(logement.getType())
            .adresse(logement.getAdresse())
            .quartier(logement.getQuartier())
            .disponible(logement.getDisponible())
            .amenities(logement.getAmenities() == null ? List.of()
                : logement.getAmenities().stream().map(AmenityCode::getCode).toList())
            .nbrMaxPersonne(logement.getNbrMaxPersonne())
            .nbrChambres(logement.getNbrChambres())
            .wc(logement.getWc())
            .caution(logement.getCaution())
            .avance(logement.getAvance())
            // Vide en base => tous les modes sont acceptés (compat. ascendante).
            .modesPaiement(logement.getModesPaiementAcceptes() == null || logement.getModesPaiementAcceptes().isEmpty()
                ? new java.util.HashSet<>(java.util.Arrays.asList(com.example.demo.model.enums.ModePaiement.values()))
                : new java.util.HashSet<>(logement.getModesPaiementAcceptes()))
            .videoUrl(logement.getVideoUrl())
            .eauDistance(logement.getEauDistance())
            .statut(logement.getStatut())
            .localisation(localisationResponse)
            .photos(photos)
            .noteMoyenne(logement.getNoteMoyenne())
            .nombreAvis(logement.getNombreAvis())
            .nombreFavoris(logement.getNombreFavoris())
            .vues(logement.getVues())
            .proprietaire(proprietaireResponse)
            .createdAt(logement.getCreatedAt())
            .updatedAt(logement.getUpdatedAt())
            .build();
}

    @Override
    public List<InterestedUserResponse> getInterestedUsers(Long logementId) {
        Logement logement = getLogementById(logementId);
        List<InterestedUserResponse> results = new ArrayList<>();

        // 1. Ajouter le propriétaire
        Users p = logement.getProprietaire();
        results.add(InterestedUserResponse.builder()
                .id(p.getId())
                .nom(p.getNom())
                .prenom(p.getPrenom())
                .avatarUrl(p.getAvatarUrl())
                .type("PROPRIETAIRE")
                .build());

        // 2. Ajouter les étudiants ayant réservé
        reservationRepository.findByLogementId(logementId).forEach(r -> {
            Users u = r.getEtudiant();
            results.add(InterestedUserResponse.builder()
                    .id(u.getId())
                    .nom(u.getNom())
                    .prenom(u.getPrenom())
                    .avatarUrl(u.getAvatarUrl())
                    .type("ETUDIANT_RESERVE")
                    .build());
        });

        // 3. Ajouter les étudiants ayant mis en favori
        favoriRepository.findByLogementId(logementId).forEach(f -> {
            Users u = f.getEtudiant();
            results.add(InterestedUserResponse.builder()
                    .id(u.getId())
                    .nom(u.getNom())
                    .prenom(u.getPrenom())
                    .avatarUrl(u.getAvatarUrl())
                    .type("ETUDIANT_FAVORI")
                    .build());
        });

        // Dédupliquer par ID (un étudiant peut être favori et avoir réservé)
        return results.stream()
                .filter(distinctByKey(InterestedUserResponse::getId))
                .collect(Collectors.toList());
    }

    private static <T> Predicate<T> distinctByKey(Function<? super T, ?> keyExtractor) {
        Map<Object, Boolean> seen = new ConcurrentHashMap<>();
        return t -> seen.putIfAbsent(keyExtractor.apply(t), Boolean.TRUE) == null;
    }

    private static String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private static String safeTrimOrFallback(String value, String fallback) {
        String trimmed = safeTrim(value);
        if (!trimmed.isBlank()) {
            return trimmed;
        }
        String fallbackTrimmed = safeTrim(fallback);
        return fallbackTrimmed.isBlank() ? trimmed : fallbackTrimmed;
    }
}
