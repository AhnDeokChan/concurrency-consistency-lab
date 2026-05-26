package com.example.backendspring;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @Value("${INSTANCE_ID:spring-unknown}")
    private String instanceId;

    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of(
                "message", "backend-spring is running",
                "instance", instanceId);
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "ok",
                "instance", instanceId);
    }
}
