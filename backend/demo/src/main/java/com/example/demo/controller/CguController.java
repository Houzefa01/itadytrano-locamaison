package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Conditions Générales d'Utilisation (cahier des charges §8). */
@RestController
@RequestMapping("/api/v1/cgu")
public class CguController {

    private static final String CONTENU = """
        1. Objet — LocaMaison met en relation des bailleurs et des étudiants pour la location de logements.
        2. Respect de la loi — Les utilisateurs s'engagent à respecter les lois malgaches en vigueur.
        3. Annonces — Toute annonce frauduleuse, trompeuse ou offensante est interdite et peut être supprimée.
        4. Comptes — La création de faux comptes est interdite. Un compte peut être suspendu en cas d'abus.
        5. Données personnelles — Les données sont protégées et utilisées uniquement pour le service.
        6. Signalement — Tout utilisateur peut signaler un compte ou une annonce abusive.
        7. Paiements — Les paiements (avance, caution, loyer) transitent via la plateforme de manière sécurisée.
        """;

    @GetMapping
    public ResponseEntity<Map<String, String>> cgu() {
        return ResponseEntity.ok(Map.of(
                "titre", "Conditions Générales d'Utilisation - LocaMaison",
                "contenu", CONTENU));
    }
}
