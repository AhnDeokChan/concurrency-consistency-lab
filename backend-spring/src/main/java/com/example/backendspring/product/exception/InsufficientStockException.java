package com.example.backendspring.product.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(Long productId, int requestedQty) {
        super("Insufficient stock for product " + productId + ", requested qty=" + requestedQty);
    }
}
