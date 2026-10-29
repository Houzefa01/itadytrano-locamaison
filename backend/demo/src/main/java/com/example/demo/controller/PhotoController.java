package com.example.demo.controller;
 
import com.example.demo.dto.PhotoResponse;
import com.example.demo.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
 
@RestController
@RequestMapping("/api/v1/logements/{logementId}/photos")
@RequiredArgsConstructor
public class PhotoController {
 
    private final PhotoService photoService;
    private final com.example.demo.repository.UserRepository userRepo;
    private final com.example.demo.service.ImageCompressionService imageCompressionService;

    @org.springframework.beans.factory.annotation.Value("${app.upload-dir:uploads}")
    private String uploadBase;

    private static final java.util.Set<String> ALLOWED_IMAGE_EXT =
            java.util.Set.of("jpg", "jpeg", "png", "webp", "gif");
 
    @GetMapping
    public ResponseEntity<List<PhotoResponse>> getPhotos(@PathVariable Long logementId) {
        return ResponseEntity.ok(photoService.getPhotos(logementId));
    }
 
    @PostMapping
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<PhotoResponse> ajouterPhoto(
            @PathVariable Long logementId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        String url        = (String)  body.get("url");
        Boolean principale = (Boolean) body.getOrDefault("principale", false);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(photoService.ajouterPhoto(logementId, url, principale, getUserId(ud)));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<List<PhotoResponse>> uploadPhotos(
            @PathVariable Long logementId,
            @RequestParam("photos") List<MultipartFile> photos,
            @AuthenticationPrincipal UserDetails ud) {
        
        List<PhotoResponse> responses = new ArrayList<>();
        
        // Récupérer les infos du propriétaire pour le nom du dossier
        com.example.demo.model.Users proprietaire = userRepo.findByTelephone(ud.getUsername()).orElseThrow();
        String landlordFolder = (proprietaire.getNom() + "_" + proprietaire.getPrenom() + "_" + proprietaire.getId())
                                .replaceAll("\\s+", "_").toLowerCase();
        
        String uploadBaseDir = uploadBase + "/photos/";
        String landlordDirPath = uploadBaseDir + landlordFolder + "/";
        
        java.io.File directory = new java.io.File(landlordDirPath);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        for (MultipartFile file : photos) {
            try {
                // Validation du type : on n'accepte que des images (sécurité + cohérence).
                String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
                String ext = original.contains(".")
                        ? original.substring(original.lastIndexOf('.') + 1).toLowerCase(java.util.Locale.ROOT)
                        : "";
                if (file.isEmpty() || !ALLOWED_IMAGE_EXT.contains(ext)) {
                    continue; // on ignore les fichiers non-image
                }

                // Compression + redimensionnement automatiques avant stockage.
                com.example.demo.service.ImageCompressionService.CompressedImage img =
                        imageCompressionService.compress(file, ext);

                // Nom de fichier unique (timestamp + UUID court) avec l'extension effective.
                String fileName = System.currentTimeMillis() + "_"
                        + java.util.UUID.randomUUID().toString().substring(0, 8) + "." + img.extension();
                java.nio.file.Path path = java.nio.file.Paths.get(landlordDirPath + fileName);
                java.nio.file.Files.write(path, img.data());

                // URL accessible publiquement (inclut le dossier du propriétaire)
                String publicUrl = "/uploads/photos/" + landlordFolder + "/" + fileName;
                responses.add(photoService.ajouterPhoto(logementId, publicUrl, false, proprietaire.getId()));
            } catch (Exception e) {
                // Photo ignorée en cas d'erreur de traitement
            }
        }
        return ResponseEntity.ok(responses);
    }
 
    @DeleteMapping("/{photoId}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long logementId,
            @PathVariable Long photoId,
            @AuthenticationPrincipal UserDetails ud) {
        photoService.supprimerPhoto(photoId, getUserId(ud));
        return ResponseEntity.noContent().build();
    }
 
    @PatchMapping("/{photoId}/principale")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<Void> definirPrincipale(
            @PathVariable Long logementId,
            @PathVariable Long photoId,
            @AuthenticationPrincipal UserDetails ud) {
        photoService.definirPrincipale(photoId, getUserId(ud));
        return ResponseEntity.ok().build();
    }
 
    private Long getUserId(UserDetails ud) {
        return userRepo.findByTelephone(ud.getUsername()).orElseThrow().getId();
    }
}
