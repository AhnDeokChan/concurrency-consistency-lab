package com.example.backendspring.product.exception;

public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(Long productId) {
        super("Product not found: " + productId);
    }

    public ProductNotFoundException(String apiId) {
        super("Product not found by apiId: " + apiId);
    }
}
