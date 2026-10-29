package com.example.demo.repository;

import com.example.demo.model.Users;
import com.example.demo.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {
    
    // Trouver par rôle
    List<Users> findByRole(UserRole role);
    
    // Vérifier existence par email (email facultatif)
    boolean existsByEmail(String email);

    // Trouver par email
    Optional<Users> findByEmail(String email);

    // Identifiant de connexion : le téléphone
    boolean existsByTelephone(String telephone);

    Optional<Users> findByTelephone(String telephone);

    // Trouver par jeton de vérification
    Optional<Users> findByVerificationToken(String token);
}