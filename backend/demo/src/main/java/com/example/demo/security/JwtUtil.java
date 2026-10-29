package com.example.demo.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);
    // HS256 exige une cle d'au moins 256 bits (32 octets).
    private static final int MIN_SECRET_BYTES = 32;

    private final Key key;
    private final long expirationTime;

    public JwtUtil(@Value("${jwt.secret:}") String secret,
                   @Value("${jwt.expiration}") long expirationTime) {
        // SECURITE: plus aucun secret par defaut exploitable n'est commite dans
        // le depot. En production, JWT_SECRET DOIT etre fourni (>= 32 octets).
        // En developpement, si aucun secret n'est defini on en genere un aleatoire
        // au demarrage : les tokens ne survivent pas a un redemarrage, ce qui est
        // sans danger pour le dev mais empeche tout secret faible/connu.
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            log.warn("JWT_SECRET absent ou trop court (< {} octets). Generation d'une cle "
                + "aleatoire ephemere : definissez JWT_SECRET en production !", MIN_SECRET_BYTES);
            this.key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        } else {
            this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }
        this.expirationTime = expirationTime;
    }

    // Le sujet du jeton est l'identifiant de connexion : le numéro de téléphone.
    public String generateToken(String username, String role) {
        return Jwts.builder()
            .setSubject(username)
            .claim("role", role)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
            .signWith(key, SignatureAlgorithm.HS256)
            .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}