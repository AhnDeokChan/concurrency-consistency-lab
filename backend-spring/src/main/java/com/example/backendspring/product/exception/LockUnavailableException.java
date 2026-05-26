package com.example.backendspring.product.exception;

public class LockUnavailableException extends RuntimeException {

    public LockUnavailableException(String lockKey) {
        super("Failed to acquire lock: " + lockKey);
    }
}
