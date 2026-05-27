package com.example.backendspring.testrun.api;

import com.example.backendspring.testrun.api.dto.TestRunCreateRequest;
import com.example.backendspring.testrun.api.dto.TestRunDetailResponse;
import com.example.backendspring.testrun.api.dto.TestRunSummaryResponse;
import com.example.backendspring.testrun.service.TestRunService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test-runs")
public class TestRunController {

    private final TestRunService testRunService;

    public TestRunController(TestRunService testRunService) {
        this.testRunService = testRunService;
    }

    @PostMapping
    public ResponseEntity<TestRunSummaryResponse> create(@Valid @RequestBody TestRunCreateRequest request) {
        TestRunSummaryResponse response = testRunService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<TestRunSummaryResponse> list(@RequestParam(defaultValue = "20") int limit) {
        return testRunService.list(limit);
    }

    @GetMapping("/{runId}")
    public TestRunDetailResponse get(@PathVariable long runId) {
        return testRunService.get(runId);
    }
}
