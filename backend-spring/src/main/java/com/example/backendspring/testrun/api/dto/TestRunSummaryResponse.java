package com.example.backendspring.testrun.api.dto;

import com.example.backendspring.testrun.domain.TestRun;
import java.time.LocalDateTime;

public record TestRunSummaryResponse(
        Long id,
        String target,
        String runState,
        Long productId,
        String productApiId,
        String productName,
        Integer requestQty,
        Integer totalRequests,
        Integer concurrency,
        Integer startStock,
        Integer endStock,
        Integer successCount,
        Integer conflict409Count,
        Integer unavailable503Count,
        Integer networkErrorCount,
        Integer abortedCount,
        Integer otherCount,
        Integer durationMs,
        LocalDateTime createdAt) {

    public static TestRunSummaryResponse from(TestRun testRun) {
        return new TestRunSummaryResponse(
                testRun.getId(),
                testRun.getTarget(),
                testRun.getRunState(),
                testRun.getProductId(),
                testRun.getProductApiId(),
                testRun.getProductName(),
                testRun.getRequestQty(),
                testRun.getTotalRequests(),
                testRun.getConcurrency(),
                testRun.getStartStock(),
                testRun.getEndStock(),
                testRun.getSuccessCount(),
                testRun.getConflict409Count(),
                testRun.getUnavailable503Count(),
                testRun.getNetworkErrorCount(),
                testRun.getAbortedCount(),
                testRun.getOtherCount(),
                testRun.getDurationMs(),
                testRun.getCreatedAt());
    }
}
