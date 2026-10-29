package com.example.demo.services;

import com.example.demo.model.Users;
import com.example.demo.model.enums.UserRole;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserRoleService {

    private final UserRepository userRepository;

    // Récupérer tous les utilisateurs par rôle
    public List<Users> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    // Récupérer tous les admins
    public List<Users> getAllAdmins() {
        return userRepository.findByRole(UserRole.ADMIN);
    }

    // Récupérer tous les étudiants
    public List<Users> getAllStudents() {
        return userRepository.findByRole(UserRole.ETUDIANT);
    }
    public List<Users> getAllOwners() {
        return userRepository.findByRole(UserRole.PROPRIETAIRE);
    }
    // Vérifier si un utilisateur peut gérer d'autres utilisateurs
    public boolean canManageUsers(Users user) {
        return user.getRole().canManageUsers();
    }

    // Vérifier si un utilisateur est en lecture seule
    public boolean isReadOnly(Users user) {
        return user.getRole().isReadOnly();
    }

    // Changer le rôle d'un utilisateur
    public Users updateRole(Long userId, UserRole newRole) {
        Users user = userRepository.findById(userId)
            .orElseThrow(() -> new com.example.demo.exceptions.ResourceNotFoundException("Utilisateur introuvable : " + userId));
        user.setRole(newRole);
        return userRepository.save(user);
    }

    // Récupérer le label du rôle d'un utilisateur
    public String getRoleLabel(Long userId) {
        Users user = userRepository.findById(userId)
            .orElseThrow(() -> new com.example.demo.exceptions.ResourceNotFoundException("Utilisateur introuvable : " + userId));
        return user.getRole().getLabel();
    }
}