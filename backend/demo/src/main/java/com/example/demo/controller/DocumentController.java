package com.example.demo.controller;

import com.example.demo.exceptions.ResourceNotFoundException;
import com.example.demo.model.Contrat;
import com.example.demo.model.Paiement;
import com.example.demo.repository.ContratRepository;
import com.example.demo.repository.PaiementRepository;
import com.example.demo.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Téléchargement des documents PDF générés côté serveur (iText). */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DocumentController {

    private final ContratRepository contratRepo;
    private final PaiementRepository paiementRepo;
    private final PdfService pdfService;

    @GetMapping(value = "/contrats/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> contratPdf(@PathVariable Long id) {
        Contrat c = contratRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contrat", id));
        byte[] pdf = pdfService.genererContrat(c);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=contrat-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping(value = "/paiements/{id}/recu", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> recuPdf(@PathVariable Long id) {
        Paiement p = paiementRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement", id));
        byte[] pdf = pdfService.genererRecu(p);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=recu-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
