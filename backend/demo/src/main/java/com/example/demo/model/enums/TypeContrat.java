package com.example.demo.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TypeContrat {
    BAIL_STUDIANT("bail_etudiant"),
    BAIL_MOBILITE("bail_mobilite"),
    BAIL_STANDARD("bail_standard");

    private final String value;

    TypeContrat(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static TypeContrat fromValue(String value) {
        if (value == null) return null;
        for (TypeContrat type : TypeContrat.values()) {
            if (type.value.equalsIgnoreCase(value) || type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown TypeContrat: " + value);
    }
}
