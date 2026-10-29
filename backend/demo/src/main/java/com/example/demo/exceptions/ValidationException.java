package com.example.demo.exceptions;

/**
 * Exception thrown when business validation fails
 */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String field, String message) {
        super(field + ": " + message);
    }
}
