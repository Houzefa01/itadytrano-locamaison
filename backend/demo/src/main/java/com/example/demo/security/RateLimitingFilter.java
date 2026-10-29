package com.example.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Limiteur de débit en mémoire (fenêtre glissante par minute, par IP+chemin).
 * Protège les points sensibles : connexion (brute-force) et inscription/mot de
 * passe oublié (envoi de SMS qui coûte de l'argent). Renvoie 429 au-delà du seuil.
 *
 * NB : implémentation mono-instance suffisante pour un déploiement simple. Pour
 * un cluster multi-noeuds, remplacer le stockage par Redis (même interface).
 */
@Component
@Order(1)
public class RateLimitingFilter extends OncePerRequestFilter {

    // Seuils par minute et par IP
    private static final int LOGIN_MAX_PER_MIN = 10;   // /api/auth/login
    private static final int SMS_MAX_PER_MIN = 5;      // register / forgot-password (SMS)
    private static final long WINDOW_MS = 60_000L;

    private record Counter(long windowStart, AtomicInteger count) {}
    private final Map<String, Counter> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        int limit = limitFor(path, request.getMethod());

        if (limit > 0) {
            String key = clientIp(request) + "|" + path;
            if (!allow(key, limit)) {
                response.setStatus(429); // Too Many Requests
                response.setContentType("application/json");
                response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Trop de tentatives. Réessayez dans une minute.\"}");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private int limitFor(String path, String method) {
        if (!"POST".equalsIgnoreCase(method)) return 0;
        if (path.equals("/api/auth/login")) return LOGIN_MAX_PER_MIN;
        if (path.equals("/api/auth/register") || path.equals("/api/auth/forgot-password")) return SMS_MAX_PER_MIN;
        return 0;
    }

    private boolean allow(String key, int limit) {
        long now = System.currentTimeMillis();
        Counter c = buckets.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart() >= WINDOW_MS) {
                return new Counter(now, new AtomicInteger(0));
            }
            return existing;
        });
        return c.count().incrementAndGet() <= limit;
    }

    private String clientIp(HttpServletRequest request) {
        String fwd = request.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) return fwd.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
