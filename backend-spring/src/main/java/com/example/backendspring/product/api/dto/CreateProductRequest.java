package com.example.backendspring.product.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateProductRequest(
        @Size(max = 50, message = "apiId must be 50 characters or fewer.") String apiId,
        @NotBlank(message = "name is required.") @Size(max = 255, message = "name must be 255 characters or fewer.")
        String name,
        @PositiveOrZero(message = "stock must be zero or positive.") Integer stock) {
}
