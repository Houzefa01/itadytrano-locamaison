package com.example.demo.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum StatutContrat {
    ACTIF("actif"),
    TERMINE("termine"),
    RESILIE("resilie");

    private final String value;

    StatutContrat(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static StatutContrat fromValue(String value) {
        if (value == null) return null;
        for (StatutContrat statut : StatutContrat.values()) {
            if (statut.value.equalsIgnoreCase(value) || statut.name().equalsIgnoreCase(value)) {
                return statut;
            }
        }
        throw new IllegalArgumentException("Unknown StatutContrat: " + value);
    }
}
