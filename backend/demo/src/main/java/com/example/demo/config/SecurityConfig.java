package com.example.demo.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.demo.security.JwtAuthenticationFilter;
import com.example.demo.security.JwtUtil;
import com.example.demo.security.CustomUserDetailsService;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtUtil jwtUtil,
            CustomUserDetailsService userDetailsService
    ) {
        return new JwtAuthenticationFilter(jwtUtil, userDetailsService);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) throws Exception {
        http
                .securityMatcher("/**")
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        // Healthcheck / sondes de déploiement (pas de données sensibles)
                        .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                        // Webhook passerelle de paiement (authentifié par signature, pas par JWT)
                        .requestMatchers("/api/v1/paiements/webhook/**").permitAll()
                        // /api/v1/sms/** n'est plus public: l'envoi de SMS coute de l'argent
                        // et etait exploitable (SMS bombing). L'inscription envoie le SMS
                        // cote serveur via SmsService, sans passer par cet endpoint.
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/api/v1/logements/me").authenticated()
                        .requestMatchers("/api/v1/logements/stats").authenticated()
                        .requestMatchers("/api/v1/upload/**").authenticated()
                        .requestMatchers("/api/v1/messages/**").authenticated()
                        .requestMatchers("/api/v1/favoris/**").authenticated()
                        .requestMatchers("/api/v1/reservations/**").authenticated()
                        .requestMatchers("/api/v1/paiements/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/logements/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/logements").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/etablissements/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/avis/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/parametres").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/cgu").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 🚀 CONFIGURATION DÉPLOIEMENT MULTI-ENVIRONNEMENTS
        List<String> allowedOrigins = new ArrayList<>();

        // Développement local (serveur Angular)
        allowedOrigins.add("http://localhost:4200");
        allowedOrigins.add("http://127.0.0.1:4200");

        // Origines de production explicites (séparées par des virgules)
        String allowedOriginsEnv = System.getenv("ALLOWED_ORIGINS");
        if (allowedOriginsEnv != null && !allowedOriginsEnv.isEmpty()) {
            for (String origin : allowedOriginsEnv.split(",")) {
                allowedOrigins.add(origin.trim());
            }
        }

        config.setAllowedOrigins(allowedOrigins);
        // Accès depuis un autre appareil du même réseau (IP privée de la machine) :
        // on autorise par motif les plages d'IP privées sur le port du dev server.
        config.setAllowedOriginPatterns(Arrays.asList(
            "http://192.168.*:*", "http://10.*:*", "http://172.16.*:*", "http://172.17.*:*",
            "http://172.18.*:*", "http://172.19.*:*", "http://172.2*.*:*", "http://172.3*.*:*"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(Arrays.asList("Authorization", "Set-Cookie", "Content-Disposition"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}