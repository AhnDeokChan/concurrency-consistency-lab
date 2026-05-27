package com.example.backendspring.product.api.dto;

import com.example.backendspring.product.domain.Product;

public record DecreaseStockResponse(
        Long productId,
        String apiId,
        int requestedQty,
        int remainingStock,
        String instance) {

    public static DecreaseStockResponse from(Product product, int requestedQty, String instance) {
        return new DecreaseStockResponse(
                product.getId(),
                product.getApiId(),
                requestedQty,
                product.getStock(),
                instance);
    }
}
