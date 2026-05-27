package com.example.backendspring.product.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DecreaseStockRequest(
        @NotNull(message = "qty는 필수입니다.") @Positive(message = "qty는 1 이상이어야 합니다.") Integer qty) {
}
