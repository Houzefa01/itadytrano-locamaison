package com.example.demo.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ModePaiement {
    MOBILE_MONEY("mobile_money"),
    VIREMENT("virement"),
    ESPECES("especes"),
    CARTE("carte");

    private final String value;

    ModePaiement(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static ModePaiement fromValue(String value) {
        if (value == null) return null;
        for (ModePaiement mode : ModePaiement.values()) {
            if (mode.value.equalsIgnoreCase(value) || mode.name().equalsIgnoreCase(value)) {
                return mode;
            }
        }
        throw new IllegalArgumentException("Unknown ModePaiement: " + value);
    }
}
