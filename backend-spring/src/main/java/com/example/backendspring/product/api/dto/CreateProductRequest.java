package com.example.backendspring.product.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateProductRequest(
        @Size(max = 50, message = "apiId는 50자 이하여야 합니다.") String apiId,
        @NotBlank(message = "name은 필수입니다.") @Size(max = 255, message = "name은 255자 이하여야 합니다.")
        String name,
        @PositiveOrZero(message = "stock은 0 이상이어야 합니다.") Integer stock) {
}
