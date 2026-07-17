package com.foodhub.analytics.controller;

import com.foodhub.analytics.dto.DashboardStats;
import com.foodhub.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStats> dashboard() {
        return ResponseEntity.ok(analyticsService.getAdminStats());
    }

    @GetMapping("/gmv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, BigDecimal>> gmv(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getDailyGmv(days));
    }

    @GetMapping("/top-restaurants")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> topRestaurants(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getTopRestaurants(limit));
    }

    @GetMapping("/top-customers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> topCustomers(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getTopCustomers(limit));
    }

    @GetMapping("/orders-by-city")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> ordersByCity() {
        return ResponseEntity.ok(analyticsService.getOrdersByCity());
    }
}
