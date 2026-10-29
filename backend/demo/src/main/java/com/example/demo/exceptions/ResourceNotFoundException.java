package com.example.demo.exceptions;

/**
 * Exception thrown when a requested resource is not found
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resourceName, Long id) {
        super(resourceName + " not found with id: " + id);
    }

    public ResourceNotFoundException(String resourceName, String identifier) {
        super(resourceName + " not found with identifier: " + identifier);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
