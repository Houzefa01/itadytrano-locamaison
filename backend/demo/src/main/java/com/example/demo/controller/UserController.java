package com.example.demo.controller;

import com.example.demo.model.enums.UserRole;
import com.example.demo.model.enums.UserStatus;
import com.example.demo.model.Users;
import com.example.demo.repository.UserRepository;
import com.example.demo.services.UserRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserRoleService userRoleService;

    // Lister tous les utilisateurs — ADMIN seulement
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Users>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // Obtenir un utilisateur par ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Modifier un utilisateur (soi-même ou ADMIN).
    // Le téléphone n'est PAS modifiable ici : étant l'identifiant de connexion, tout
    // changement passe par une vérification SMS (POST /api/profile/telephone/request
    // puis /confirm). Le champ telephone reçu est donc ignoré.
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.userId")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Users updated) {
        return userRepository.findById(id).map(user -> {
            user.setNom(updated.getNom());
            user.setPrenom(updated.getPrenom());
            user.setAvatarUrl(updated.getAvatarUrl());
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Supprimer un utilisateur
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé"));
    }

    // Changer le rôle
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateRole(@PathVariable Long id,
                                        @RequestParam UserRole role) {
        Users updated = userRoleService.updateRole(id, role);
        return ResponseEntity.ok(updated);
    }

    // Mise à jour d'état (status)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestParam UserStatus status) {
        return userRepository.findById(id).map(user -> {
            user.setStatus(status);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Vérifier / dévérifier un bailleur — ADMIN
    @PatchMapping("/{id}/verifier-bailleur")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> verifierBailleur(@PathVariable Long id,
                                              @RequestParam(defaultValue = "true") boolean verifie) {
        return userRepository.findById(id).map(user -> {
            user.setBailleurVerifie(verifie);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Lister par rôle
    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Users>> getUsersByRole(@PathVariable UserRole role) {
        return ResponseEntity.ok(userRoleService.getUsersByRole(role));
    }
}
