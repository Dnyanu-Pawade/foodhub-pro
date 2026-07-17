package com.foodhub.common.config;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/admin/platform")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class PlatformController {

    private final UserRepository userRepository;

    // In-memory store (replace with DB entity in production)
    private static final Map<String, String> SETTINGS = new ConcurrentHashMap<>(Map.of(
        "platformName", "FoodHub Pro",
        "supportEmail", "support@foodhubpro.in",
        "supportPhone", "+91-9999999999",
        "defaultCommissionRate", "15",
        "deliveryFeePerKm", "5",
        "minOrderAmount", "99",
        "maxDeliveryRadius", "10"
    ));

    private static final List<Map<String, Object>> AUDIT_LOGS = new ArrayList<>();

    @GetMapping("/settings")
    public ResponseEntity<Map<String, String>> getSettings() {
        return ResponseEntity.ok(SETTINGS);
    }

    @PatchMapping("/settings")
    public ResponseEntity<?> updateSetting(@RequestBody Map<String, String> body) {
        String key = body.get("key"); String value = body.get("value");
        if (key != null && value != null) {
            SETTINGS.put(key, value);
            Map<String, Object> log = new HashMap<>();
            log.put("action", "SETTING_UPDATED: " + key + " = " + value);
            log.put("performedBy", "admin");
            log.put("createdAt", LocalDateTime.now());
            AUDIT_LOGS.add(0, log);
        }
        return ResponseEntity.ok(Map.of("message", "Saved"));
    }

    @GetMapping("/feature-flags")
    public ResponseEntity<List<Map<String, Object>>> getFlags() {
        return ResponseEntity.ok(List.of());
    }

    @PatchMapping("/feature-flags/{key}")
    public ResponseEntity<?> toggleFlag(@PathVariable String key, @RequestParam boolean enabled) {
        Map<String, Object> log = new HashMap<>();
        log.put("action", "FEATURE_FLAG: " + key + " -> " + (enabled ? "ENABLED" : "DISABLED"));
        log.put("performedBy", "admin");
        log.put("createdAt", LocalDateTime.now());
        AUDIT_LOGS.add(0, log);
        return ResponseEntity.ok(Map.of("message", "Updated"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<Map<String, Object>>> auditLogs() {
        return ResponseEntity.ok(AUDIT_LOGS);
    }

    @PatchMapping("/users/{id}/block")
    public ResponseEntity<?> blockUser(@PathVariable Long id) {
        User u = userRepository.findById(id).orElseThrow();
        u.setEnabled(false);
        userRepository.save(u);
        Map<String, Object> log = new HashMap<>();
        log.put("action", "USER_BLOCKED: " + u.getEmail());
        log.put("performedBy", "admin");
        log.put("createdAt", LocalDateTime.now());
        AUDIT_LOGS.add(0, log);
        return ResponseEntity.ok(Map.of("message", "User blocked"));
    }
}
