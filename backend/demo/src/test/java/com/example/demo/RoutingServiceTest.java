package com.example.demo;

import com.example.demo.service.RoutingService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Test unitaire (sans contexte Spring) du calcul de distance Haversine. */
class RoutingServiceTest {

    private final RoutingService service = new RoutingService();

    @Test
    void haversineMemePoint() {
        assertEquals(0.0, service.haversineKm(-12.2787, 49.2917, -12.2787, 49.2917), 0.01);
    }

    @Test
    void haversineDistancePlausible() {
        // Université d'Antsiranana -> ENSET : quelques centaines de mètres
        double km = service.haversineKm(-12.2787, 49.2917, -12.2795, 49.2901);
        assertTrue(km > 0 && km < 5, "distance attendue entre 0 et 5 km, obtenue: " + km);
    }
}
