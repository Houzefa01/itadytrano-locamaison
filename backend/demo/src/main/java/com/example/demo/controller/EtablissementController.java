package com.example.demo.controller;

import com.example.demo.exceptions.ResourceNotFoundException;
import com.example.demo.model.Etablissement;
import com.example.demo.repository.EtablissementRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/etablissements")
@RequiredArgsConstructor
public class EtablissementController {

    private final EtablissementRepository repo;

    /** Liste publique (utilisée notamment à l'inscription étudiant). */
    @GetMapping
    public ResponseEntity<List<Etablissement>> all() {
        return ResponseEntity.ok(repo.findAllByOrderByNomAsc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Etablissement> one(@PathVariable Long id) {
        return ResponseEntity.ok(repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Établissement", id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Etablissement> create(@Valid @RequestBody Etablissement e) {
        e.setId(null);
        if (e.getType() == null) e.setType(com.example.demo.model.enums.EtablissementType.AUTRE);
        if (e.getVille() == null) e.setVille("Antsiranana");
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(e));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Etablissement> update(@PathVariable Long id, @Valid @RequestBody Etablissement body) {
        Etablissement e = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Établissement", id));
        e.setNom(body.getNom());
        e.setType(body.getType());
        e.setAdresse(body.getAdresse());
        e.setVille(body.getVille());
        e.setLatitude(body.getLatitude());
        e.setLongitude(body.getLongitude());
        return ResponseEntity.ok(repo.save(e));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException("Établissement", id);
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
