package com.example.backendspring.testrun.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record TestRequestLogCreateRequest(
        @NotNull @Positive Integer requestIndex,
        @NotBlank String statusLabel,
        Integer statusCode,
        @NotNull @PositiveOrZero Integer durationMs,
        String instanceId,
        String message,
        Integer remainingStock,
        String requestAt) {
}
