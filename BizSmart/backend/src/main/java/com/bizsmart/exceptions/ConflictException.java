package com.bizsmart.exceptions;

/** Mapped to HTTP 409 by {@link GlobalExceptionHandler} (duplicates, invalid state changes). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
