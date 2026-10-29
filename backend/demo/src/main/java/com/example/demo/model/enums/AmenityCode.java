package com.example.demo.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum AmenityCode {
    EAU("eau"),
    ELECTRICITE("electricite"),
    WC("wc"),
    DOUCHE("douche"),
    PRES_DE_ROUTE("pres_de_route"),
    AVOIR_COUR("avoir_cour"),
    FACTURE_INCLUSE("facture_incluse"),
    MEUBLE("meuble"),
    SECURITE("securite");

    private final String code;

    AmenityCode(String code) {
        this.code = code;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static AmenityCode fromJson(String value) {
        return from(value);
    }

    public static AmenityCode from(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Amenity code cannot be null");
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');
        for (AmenityCode code : values()) {
            if (code.code.equals(normalized) || code.name().equals(normalized.toUpperCase(Locale.ROOT))) {
                return code;
            }
        }
        throw new IllegalArgumentException("Unknown amenity code: " + value);
    }
}
