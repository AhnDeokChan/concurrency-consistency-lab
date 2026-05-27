package com.example.backendspring.product.api.dto;

import com.example.backendspring.product.domain.Product;

public record ProductStockOptionResponse(
        Long id,
        String apiId,
        String name,
        Integer stock,
        String instance) {

    public static ProductStockOptionResponse from(Product product, String instance) {
        return new ProductStockOptionResponse(
                product.getId(),
                product.getApiId(),
                product.getName(),
                product.getStock(),
                instance);
    }
}
