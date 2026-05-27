package com.example.backendspring.testrun.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.backendspring.testrun.api.dto.TestRequestLogCreateRequest;
import com.example.backendspring.testrun.api.dto.TestRunCreateRequest;
import com.example.backendspring.testrun.api.dto.TestRunDetailResponse;
import com.example.backendspring.testrun.api.dto.TestRunSummaryResponse;
import com.example.backendspring.testrun.exception.TestRunNotFoundException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TestRunServiceIntegrationTest {

    @Autowired
    private TestRunService testRunService;

    @Test
    void createAndGetTestRun() {
        TestRunCreateRequest request = new TestRunCreateRequest(
                "spring",
                "http://localhost:5010",
                1L,
                "sample-product-001",
                "Sample Product 01",
                1,
                3,
                2,
                2500,
                "DONE",
                100,
                97,
                3,
                0,
                0,
                0,
                0,
                0,
                18,
                30,
                12.34,
                240,
                "2026-05-27T10:00:00Z",
                "2026-05-27T10:00:01Z",
                null,
                List.of(new TestRequestLogCreateRequest(
                        1,
                        "200",
                        200,
                        20,
                        "spring-1",
                        "OK",
                        99,
                        "2026-05-27T10:00:00Z")));

        TestRunSummaryResponse created = testRunService.create(request);
        List<TestRunSummaryResponse> runs = testRunService.list(10);
        TestRunDetailResponse detail = testRunService.get(created.id());

        assertThat(created.id()).isNotNull();
        assertThat(runs).isNotEmpty();
        assertThat(detail.runState()).isEqualTo("DONE");
        assertThat(detail.successCount()).isEqualTo(3);
        assertThat(detail.requestLogs()).hasSize(1);
        assertThat(detail.requestLogs().get(0).statusCode()).isEqualTo(200);
    }

    @Test
    void getThrowsWhenRunNotFound() {
        assertThatThrownBy(() -> testRunService.get(999_999L))
                .isInstanceOf(TestRunNotFoundException.class);
    }
}
