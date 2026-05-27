package com.example.backendspring.testrun.api.dto;

import com.example.backendspring.testrun.domain.TestRun;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record TestRunDetailResponse(
        Long id,
        String target,
        String baseUrl,
        String runState,
        Long productId,
        String productApiId,
        String productName,
        Integer requestQty,
        Integer totalRequests,
        Integer concurrency,
        Integer timeoutMs,
        Integer startStock,
        Integer endStock,
        Integer successCount,
        Integer conflict409Count,
        Integer unavailable503Count,
        Integer networkErrorCount,
        Integer abortedCount,
        Integer otherCount,
        Integer avgLatencyMs,
        Integer p95LatencyMs,
        BigDecimal throughputRps,
        Integer durationMs,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String runErrorMessage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<TestRequestLogResponse> requestLogs) {

    public static TestRunDetailResponse from(TestRun testRun) {
        return new TestRunDetailResponse(
                testRun.getId(),
                testRun.getTarget(),
                testRun.getBaseUrl(),
                testRun.getRunState(),
                testRun.getProductId(),
                testRun.getProductApiId(),
                testRun.getProductName(),
                testRun.getRequestQty(),
                testRun.getTotalRequests(),
                testRun.getConcurrency(),
                testRun.getTimeoutMs(),
                testRun.getStartStock(),
                testRun.getEndStock(),
                testRun.getSuccessCount(),
                testRun.getConflict409Count(),
                testRun.getUnavailable503Count(),
                testRun.getNetworkErrorCount(),
                testRun.getAbortedCount(),
                testRun.getOtherCount(),
                testRun.getAvgLatencyMs(),
                testRun.getP95LatencyMs(),
                testRun.getThroughputRps(),
                testRun.getDurationMs(),
                testRun.getStartedAt(),
                testRun.getFinishedAt(),
                testRun.getRunErrorMessage(),
                testRun.getCreatedAt(),
                testRun.getUpdatedAt(),
                testRun.getRequestLogs().stream()
                        .map(TestRequestLogResponse::from)
                        .toList());
    }
}
