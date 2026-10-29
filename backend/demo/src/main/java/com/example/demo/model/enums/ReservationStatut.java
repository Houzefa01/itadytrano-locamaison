package com.example.demo.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ReservationStatut {
    EN_ATTENTE("en_attente"),
    VISITE_PLANIFIEE("visite_planifiee"),
    ATTENTE_PAIEMENT("attente_paiement"),
    EN_ATTENTE_VALIDATION_PROPRIO("en_attente_validation_proprio"),
    LOGEMENT_RESERVE("logement_reserve"),
    ANNULE("annule"),
    ANNULE_REFUSE("annule_refuse");

    private final String value;

    ReservationStatut(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static ReservationStatut fromValue(String value) {
        if (value == null) return null;
        for (ReservationStatut statut : ReservationStatut.values()) {
            if (statut.value.equalsIgnoreCase(value) || statut.name().equalsIgnoreCase(value)) {
                return statut;
            }
        }
        throw new IllegalArgumentException("Unknown ReservationStatut: " + value);
    }
}
