package com.example.demo.controller;

import com.example.demo.model.Parametre;
import com.example.demo.repository.ParametreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parametres")
@RequiredArgsConstructor
public class ParametreController {

    private final ParametreRepository repo;

    /** Lecture publique des paramètres du site. */
    @GetMapping
    public ResponseEntity<List<Parametre>> all() {
        return ResponseEntity.ok(repo.findAll());
    }

    @PutMapping("/{cle}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Parametre> upsert(@PathVariable String cle, @RequestBody Parametre body) {
        Parametre p = repo.findById(cle).orElse(Parametre.builder().cle(cle).build());
        p.setValeur(body.getValeur());
        if (body.getDescription() != null) p.setDescription(body.getDescription());
        return ResponseEntity.ok(repo.save(p));
    }
}
