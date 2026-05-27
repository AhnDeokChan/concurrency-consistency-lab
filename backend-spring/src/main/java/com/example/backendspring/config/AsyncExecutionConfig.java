package com.example.backendspring.config;

import java.util.concurrent.Executor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
// 비동기 실행 스레드풀 등록
public class AsyncExecutionConfig {

    @Bean(name = "productTaskExecutor")
    // 상품 비동기 전용 Executor
    public Executor productTaskExecutor(
            @Value("${app.async.product.core-pool-size:8}") int corePoolSize,
            @Value("${app.async.product.max-pool-size:32}") int maxPoolSize,
            @Value("${app.async.product.queue-capacity:500}") int queueCapacity,
            @Value("${app.async.product.thread-name-prefix:product-async-}") String threadNamePrefix,
            @Value("${app.async.product.await-termination-seconds:30}") int awaitTerminationSeconds) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // 기본 스레드 수
        executor.setCorePoolSize(corePoolSize);
        // 최대 스레드 수
        executor.setMaxPoolSize(maxPoolSize);
        // 작업 대기열 크기
        executor.setQueueCapacity(queueCapacity);
        // 스레드 이름 접두어
        executor.setThreadNamePrefix(threadNamePrefix);
        // 종료 시 작업 완료 대기
        executor.setWaitForTasksToCompleteOnShutdown(true);
        // 종료 대기 시간(초)
        executor.setAwaitTerminationSeconds(awaitTerminationSeconds);
        executor.initialize();
        return executor;
    }
}
