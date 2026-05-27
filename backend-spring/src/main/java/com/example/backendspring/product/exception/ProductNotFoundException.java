package com.example.backendspring.product.exception;

public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(Long productId) {
        super("상품을 찾을 수 없습니다: " + productId);
    }

    public ProductNotFoundException(String apiId) {
        super("apiId로 상품을 찾을 수 없습니다: " + apiId);
    }
}
