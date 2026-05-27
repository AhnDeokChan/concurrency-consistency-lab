package com.example.backendspring.testrun.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;

public record TestRunCreateRequest(
        @NotBlank String target,
        @NotBlank String baseUrl,
        @NotNull Long productId,
        String productApiId,
        String productName,
        @NotNull @Positive Integer requestQty,
        @NotNull @Positive Integer totalRequests,
        @NotNull @Positive Integer concurrency,
        @NotNull @Positive Integer timeoutMs,
        @NotBlank String runState,
        Integer startStock,
        Integer endStock,
        @NotNull @PositiveOrZero Integer successCount,
        @NotNull @PositiveOrZero Integer conflict409Count,
        @NotNull @PositiveOrZero Integer unavailable503Count,
        @NotNull @PositiveOrZero Integer networkErrorCount,
        @NotNull @PositiveOrZero Integer abortedCount,
        @NotNull @PositiveOrZero Integer otherCount,
        Integer avgLatencyMs,
        Integer p95LatencyMs,
        Double throughputRps,
        Integer durationMs,
        String startedAt,
        String finishedAt,
        String runErrorMessage,
        @Valid List<TestRequestLogCreateRequest> requestLogs) {
}
