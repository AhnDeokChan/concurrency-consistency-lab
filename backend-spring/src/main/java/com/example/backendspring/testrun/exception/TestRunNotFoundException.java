package com.example.backendspring.testrun.exception;

public class TestRunNotFoundException extends RuntimeException {

    public TestRunNotFoundException(Long runId) {
        super("테스트 실행 이력을 찾을 수 없습니다: " + runId);
    }
}
