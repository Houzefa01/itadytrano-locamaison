package com.example.demo.security;

import com.example.demo.model.Users;
import com.example.demo.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String telephone) throws UsernameNotFoundException {
        // L'identifiant de connexion est le numéro de téléphone (l'email est facultatif).
        Users user = userRepository.findByTelephone(telephone)
            .orElseThrow(() -> new UsernameNotFoundException(
                "Utilisateur non trouvé avec le téléphone: " + telephone));
        return new UserPrincipal(user);
    }
}