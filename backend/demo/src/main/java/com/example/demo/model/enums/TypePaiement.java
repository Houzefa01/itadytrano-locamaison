package com.example.demo.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TypePaiement {
    LOYER_MENSUEL("loyer_mensuel"),
    DEPOT_GARANTIE("depot_garantie"),
    ACOMPTE_RESERVATION("acompte_reservation"),
    FRAIS_VISITE("frais_visite");

    private final String value;

    TypePaiement(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static TypePaiement fromValue(String value) {
        if (value == null) return null;
        for (TypePaiement type : TypePaiement.values()) {
            if (type.value.equalsIgnoreCase(value) || type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown TypePaiement: " + value);
    }
}
