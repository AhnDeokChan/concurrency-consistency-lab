package com.example.backendspring.testrun.service;

import com.example.backendspring.testrun.api.dto.TestRequestLogCreateRequest;
import com.example.backendspring.testrun.api.dto.TestRunCreateRequest;
import com.example.backendspring.testrun.api.dto.TestRunDetailResponse;
import com.example.backendspring.testrun.api.dto.TestRunSummaryResponse;
import com.example.backendspring.testrun.domain.TestRequestLog;
import com.example.backendspring.testrun.domain.TestRun;
import com.example.backendspring.testrun.domain.TestRunRepository;
import com.example.backendspring.testrun.exception.TestRunNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TestRunService {

    private static final int MAX_LIST_LIMIT = 100;

    private final TestRunRepository testRunRepository;

    public TestRunService(TestRunRepository testRunRepository) {
        this.testRunRepository = testRunRepository;
    }

    @Transactional
    public TestRunSummaryResponse create(TestRunCreateRequest request) {
        TestRun testRun = new TestRun();
        testRun.setTarget(request.target().trim());
        testRun.setBaseUrl(request.baseUrl().trim());
        testRun.setRunState(request.runState().trim());
        testRun.setProductId(request.productId());
        testRun.setProductApiId(trimToNull(request.productApiId()));
        testRun.setProductName(trimToNull(request.productName()));
        testRun.setRequestQty(request.requestQty());
        testRun.setTotalRequests(request.totalRequests());
        testRun.setConcurrency(request.concurrency());
        testRun.setTimeoutMs(request.timeoutMs());
        testRun.setStartStock(request.startStock());
        testRun.setEndStock(request.endStock());
        testRun.setSuccessCount(request.successCount());
        testRun.setConflict409Count(request.conflict409Count());
        testRun.setUnavailable503Count(request.unavailable503Count());
        testRun.setNetworkErrorCount(request.networkErrorCount());
        testRun.setAbortedCount(request.abortedCount());
        testRun.setOtherCount(request.otherCount());
        testRun.setAvgLatencyMs(request.avgLatencyMs());
        testRun.setP95LatencyMs(request.p95LatencyMs());
        testRun.setDurationMs(request.durationMs());
        testRun.setThroughputRps(toScaledDecimal(request.throughputRps()));
        testRun.setStartedAt(parseDateTime(request.startedAt()));
        testRun.setFinishedAt(parseDateTime(request.finishedAt()));
        testRun.setRunErrorMessage(trimToNull(request.runErrorMessage()));

        List<TestRequestLogCreateRequest> requestLogs = request.requestLogs() == null
                ? List.of()
                : request.requestLogs();
        for (TestRequestLogCreateRequest requestLog : requestLogs) {
            testRun.addRequestLog(toEntity(requestLog));
        }

        TestRun saved = testRunRepository.save(testRun);
        return TestRunSummaryResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<TestRunSummaryResponse> list(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), MAX_LIST_LIMIT);
        PageRequest pageRequest = PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "id"));
        return testRunRepository.findAll(pageRequest).stream()
                .map(TestRunSummaryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TestRunDetailResponse get(long runId) {
        TestRun testRun = testRunRepository.findWithRequestLogsById(runId)
                .orElseThrow(() -> new TestRunNotFoundException(runId));
        return TestRunDetailResponse.from(testRun);
    }

    private TestRequestLog toEntity(TestRequestLogCreateRequest requestLog) {
        TestRequestLog entity = new TestRequestLog();
        entity.setRequestIndex(requestLog.requestIndex());
        entity.setStatusLabel(requestLog.statusLabel().trim());
        entity.setStatusCode(requestLog.statusCode());
        entity.setDurationMs(requestLog.durationMs());
        entity.setInstanceId(trimToNull(requestLog.instanceId()));
        entity.setMessage(trimToNull(requestLog.message()));
        entity.setRemainingStock(requestLog.remainingStock());
        entity.setRequestAt(parseDateTime(requestLog.requestAt()));
        return entity;
    }

    private BigDecimal toScaledDecimal(Double throughputRps) {
        if (throughputRps == null) {
            return null;
        }
        return BigDecimal.valueOf(throughputRps).setScale(2, RoundingMode.HALF_UP);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();
        try {
            return LocalDateTime.ofInstant(Instant.parse(normalized), ZoneOffset.UTC);
        } catch (DateTimeParseException ignored) {
            // ISO instant 미일치
        }

        try {
            return OffsetDateTime.parse(normalized).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            // ISO offset datetime 미일치
        }

        try {
            return LocalDateTime.parse(normalized);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다: " + value);
        }
    }
}
