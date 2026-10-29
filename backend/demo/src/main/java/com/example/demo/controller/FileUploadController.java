package com.example.demo.controller;

import com.example.demo.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class FileUploadController {

    @org.springframework.beans.factory.annotation.Value("${app.upload-dir:uploads}")
    private String uploadBase;
    private String uploadDir() { return uploadBase + "/messages/"; }

    // Liste blanche des types autorisés : on bloque notamment .html/.svg/.js
    // (XSS stocké servi en statique) et tout fichier exécutable.
    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of("jpg", "jpeg", "png", "webp", "gif", "pdf", "odt", "docx");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "application/pdf", "application/vnd.oasis.opendocument.text",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        // Validation du type de fichier (extension + content-type)
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf(".") + 1).toLowerCase(Locale.ROOT);
        }
        String contentType = file.getContentType();
        if (!ALLOWED_EXTENSIONS.contains(extension)
                || contentType == null
                || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Type de fichier non autorisé"));
        }

        try {
            // Créer le dossier s'il n'existe pas
            File directory = new File(uploadDir());
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Générer un nom unique (UUID) en conservant l'extension validée
            String fileName = UUID.randomUUID().toString() + "." + extension;
            Path path = Paths.get(uploadDir() + fileName);

            // Sauvegarder le fichier
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

            // Retourner l'URL publique
            String publicUrl = "/uploads/messages/" + fileName;
            return ResponseEntity.ok(Map.of("url", publicUrl));

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
