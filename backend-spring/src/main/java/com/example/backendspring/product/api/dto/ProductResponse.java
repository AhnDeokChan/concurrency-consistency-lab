package com.example.backendspring.product.api.dto;

import com.example.backendspring.product.domain.Product;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String apiId,
        String name,
        Integer stock,
        LocalDateTime deletedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String instance) {

    public static ProductResponse from(Product product, String instance) {
        return new ProductResponse(
                product.getId(),
                product.getApiId(),
                product.getName(),
                product.getStock(),
                product.getDeletedAt(),
                product.getCreatedAt(),
                product.getUpdatedAt(),
                instance);
    }
}
