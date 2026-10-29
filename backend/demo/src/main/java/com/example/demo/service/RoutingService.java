package com.example.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;

/**
 * Calcul de distance/temps de trajet entre deux points.
 * Utilise le service de routage OSRM (routes réelles) avec repli automatique
 * sur la distance à vol d'oiseau (Haversine) si le service est injoignable.
 */
@Service
public class RoutingService {

    public record DistanceResult(double distanceKm, double dureeMinutes, String source) {}

    private static final String OSRM_BASE = "https://router.project-osrm.org/route/v1/driving/";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    public DistanceResult distance(double lat1, double lon1, double lat2, double lon2) {
        try {
            String url = String.format(Locale.US,
                    "%s%f,%f;%f,%f?overview=false", OSRM_BASE, lon1, lat1, lon2, lat2);
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(4))
                    .GET().build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                JsonNode root = mapper.readTree(resp.body());
                JsonNode routes = root.path("routes");
                if (routes.isArray() && routes.size() > 0) {
                    double meters = routes.get(0).path("distance").asDouble();
                    double seconds = routes.get(0).path("duration").asDouble();
                    return new DistanceResult(round(meters / 1000.0), round(seconds / 60.0), "OSRM");
                }
            }
        } catch (Exception ignored) {
            // service injoignable -> repli Haversine
        }
        double km = haversineKm(lat1, lon1, lat2, lon2);
        // Estimation de durée : ~25 km/h en milieu urbain
        return new DistanceResult(round(km), round(km / 25.0 * 60.0), "HAVERSINE");
    }

    public double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
