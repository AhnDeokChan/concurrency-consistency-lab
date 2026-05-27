package com.example.backendspring.testrun.api.dto;

import com.example.backendspring.testrun.domain.TestRequestLog;
import java.time.LocalDateTime;

public record TestRequestLogResponse(
        Long id,
        Integer requestIndex,
        String statusLabel,
        Integer statusCode,
        Integer durationMs,
        String instanceId,
        String message,
        Integer remainingStock,
        LocalDateTime requestAt,
        LocalDateTime createdAt) {

    public static TestRequestLogResponse from(TestRequestLog requestLog) {
        return new TestRequestLogResponse(
                requestLog.getId(),
                requestLog.getRequestIndex(),
                requestLog.getStatusLabel(),
                requestLog.getStatusCode(),
                requestLog.getDurationMs(),
                requestLog.getInstanceId(),
                requestLog.getMessage(),
                requestLog.getRemainingStock(),
                requestLog.getRequestAt(),
                requestLog.getCreatedAt());
    }
}
