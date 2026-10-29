package com.example.demo.security;

import com.example.demo.model.Users;
import com.example.demo.model.enums.UserRole;
import com.example.demo.model.enums.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private static final Logger log = LoggerFactory.getLogger(UserPrincipal.class);
    private final Users user;
    

    public UserPrincipal(Users user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        this.user = user;
    }
   @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String roleName = user.getRole() != null ? user.getRole().name() : "ETUDIANT";
        String authority = "ROLE_" + roleName;
        
        // Log interne pour vérifier ce qui est envoyé à Spring Security
        // System.out.println("UserPrincipal: Loading authorities for " + user.getEmail() + " -> " + authority);
        
        return List.of(new SimpleGrantedAuthority(authority));
    }

    public Users getUser() { return user; }
    public Long getUserId() { return user.getId(); }

    @Override public String getPassword() { return user.getPassword(); }
    @Override public String getUsername() { return user.getTelephone(); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() {
        return user.getStatus() == UserStatus.ACTIVE;
    }
}