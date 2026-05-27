package com.example.backendspring.product.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(Long productId, int requestedQty) {
        super("재고가 부족합니다. productId=" + productId + ", 요청 수량=" + requestedQty);
    }
}
