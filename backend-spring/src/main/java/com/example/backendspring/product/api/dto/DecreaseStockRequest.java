package com.example.backendspring.product.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DecreaseStockRequest(
        @NotNull(message = "qty is required.") @Positive(message = "qty must be greater than zero.") Integer qty) {
}
