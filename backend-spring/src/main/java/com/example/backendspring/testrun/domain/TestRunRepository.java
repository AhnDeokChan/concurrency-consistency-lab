package com.example.backendspring.testrun.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TestRunRepository extends JpaRepository<TestRun, Long> {

    @Query("select distinct tr from TestRun tr left join fetch tr.requestLogs where tr.id = :id")
    Optional<TestRun> findWithRequestLogsById(Long id);
}
