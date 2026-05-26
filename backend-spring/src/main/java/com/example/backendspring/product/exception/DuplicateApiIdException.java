package com.example.backendspring.product.exception;

public class DuplicateApiIdException extends RuntimeException {

    public DuplicateApiIdException(String apiId) {
        super("Duplicate apiId: " + apiId);
    }
}
