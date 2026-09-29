package com.bizsmart.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "BizSmart Backend API");
        response.put("version", "1.0.0");
        response.put("timestamp", Instant.now().toString());

        // Check database connection health
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection()) {
                response.put("database", "CONNECTED");
                response.put("databaseProduct", conn.getMetaData().getDatabaseProductName());
                response.put("databaseValid", conn.isValid(2));
            } catch (Exception e) {
                // Do not leak connection details publicly
                response.put("database", "UNAVAILABLE");
            }
        } else {
            response.put("database", "NO_DATASOURCE");
        }

        return ResponseEntity.ok(response);
    }
}
