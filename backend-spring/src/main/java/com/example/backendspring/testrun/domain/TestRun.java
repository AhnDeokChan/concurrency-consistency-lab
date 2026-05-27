package com.example.backendspring.testrun.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "test_runs")
public class TestRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String target;

    @Column(name = "base_url", nullable = false, length = 255)
    private String baseUrl;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_api_id", length = 50)
    private String productApiId;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "request_qty", nullable = false)
    private Integer requestQty;

    @Column(name = "total_requests", nullable = false)
    private Integer totalRequests;

    @Column(nullable = false)
    private Integer concurrency;

    @Column(name = "timeout_ms", nullable = false)
    private Integer timeoutMs;

    @Column(name = "run_state", nullable = false, length = 20)
    private String runState;

    @Column(name = "start_stock")
    private Integer startStock;

    @Column(name = "end_stock")
    private Integer endStock;

    @Column(name = "success_count", nullable = false)
    private Integer successCount = 0;

    @Column(name = "conflict_409_count", nullable = false)
    private Integer conflict409Count = 0;

    @Column(name = "unavailable_503_count", nullable = false)
    private Integer unavailable503Count = 0;

    @Column(name = "network_error_count", nullable = false)
    private Integer networkErrorCount = 0;

    @Column(name = "aborted_count", nullable = false)
    private Integer abortedCount = 0;

    @Column(name = "other_count", nullable = false)
    private Integer otherCount = 0;

    @Column(name = "avg_latency_ms")
    private Integer avgLatencyMs;

    @Column(name = "p95_latency_ms")
    private Integer p95LatencyMs;

    @Column(name = "throughput_rps", precision = 10, scale = 2)
    private BigDecimal throughputRps;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "run_error_message", length = 500)
    private String runErrorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "testRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("requestIndex ASC")
    private List<TestRequestLog> requestLogs = new ArrayList<>();

    public void addRequestLog(TestRequestLog requestLog) {
        requestLog.setTestRun(this);
        this.requestLogs.add(requestLog);
    }

    public Long getId() {
        return id;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductApiId() {
        return productApiId;
    }

    public void setProductApiId(String productApiId) {
        this.productApiId = productApiId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getRequestQty() {
        return requestQty;
    }

    public void setRequestQty(Integer requestQty) {
        this.requestQty = requestQty;
    }

    public Integer getTotalRequests() {
        return totalRequests;
    }

    public void setTotalRequests(Integer totalRequests) {
        this.totalRequests = totalRequests;
    }

    public Integer getConcurrency() {
        return concurrency;
    }

    public void setConcurrency(Integer concurrency) {
        this.concurrency = concurrency;
    }

    public Integer getTimeoutMs() {
        return timeoutMs;
    }

    public void setTimeoutMs(Integer timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public String getRunState() {
        return runState;
    }

    public void setRunState(String runState) {
        this.runState = runState;
    }

    public Integer getStartStock() {
        return startStock;
    }

    public void setStartStock(Integer startStock) {
        this.startStock = startStock;
    }

    public Integer getEndStock() {
        return endStock;
    }

    public void setEndStock(Integer endStock) {
        this.endStock = endStock;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }

    public Integer getConflict409Count() {
        return conflict409Count;
    }

    public void setConflict409Count(Integer conflict409Count) {
        this.conflict409Count = conflict409Count;
    }

    public Integer getUnavailable503Count() {
        return unavailable503Count;
    }

    public void setUnavailable503Count(Integer unavailable503Count) {
        this.unavailable503Count = unavailable503Count;
    }

    public Integer getNetworkErrorCount() {
        return networkErrorCount;
    }

    public void setNetworkErrorCount(Integer networkErrorCount) {
        this.networkErrorCount = networkErrorCount;
    }

    public Integer getAbortedCount() {
        return abortedCount;
    }

    public void setAbortedCount(Integer abortedCount) {
        this.abortedCount = abortedCount;
    }

    public Integer getOtherCount() {
        return otherCount;
    }

    public void setOtherCount(Integer otherCount) {
        this.otherCount = otherCount;
    }

    public Integer getAvgLatencyMs() {
        return avgLatencyMs;
    }

    public void setAvgLatencyMs(Integer avgLatencyMs) {
        this.avgLatencyMs = avgLatencyMs;
    }

    public Integer getP95LatencyMs() {
        return p95LatencyMs;
    }

    public void setP95LatencyMs(Integer p95LatencyMs) {
        this.p95LatencyMs = p95LatencyMs;
    }

    public BigDecimal getThroughputRps() {
        return throughputRps;
    }

    public void setThroughputRps(BigDecimal throughputRps) {
        this.throughputRps = throughputRps;
    }

    public Integer getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Integer durationMs) {
        this.durationMs = durationMs;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(LocalDateTime finishedAt) {
        this.finishedAt = finishedAt;
    }

    public String getRunErrorMessage() {
        return runErrorMessage;
    }

    public void setRunErrorMessage(String runErrorMessage) {
        this.runErrorMessage = runErrorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<TestRequestLog> getRequestLogs() {
        return requestLogs;
    }
}
