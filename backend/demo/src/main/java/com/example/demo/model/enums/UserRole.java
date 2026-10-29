package com.example.demo.model.enums;

public enum UserRole {

    ETUDIANT("Étudiant"),
    PROPRIETAIRE("Propriétaire"),
    ADMIN("Administrateur");

    private final String label;

    UserRole(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public boolean canManageUsers() {
        return this == ADMIN;
    }

    public boolean isReadOnly() {
        return this == ETUDIANT;
    }
}