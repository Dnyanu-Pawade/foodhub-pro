package com.foodhub.common.config;

import com.foodhub.common.service.SurgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/surge")
@RequiredArgsConstructor
public class SurgeController {

    private final SurgeService surgeService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
            "active", surgeService.isSurgeActive(),
            "multiplier", surgeService.getSurgeMultiplier(),
            "reason", surgeService.getSurgeReason() != null ? surgeService.getSurgeReason() : ""
        ));
    }

    @PostMapping("/admin/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> toggle(@RequestParam boolean enabled) {
        surgeService.setAdminSurge(enabled);
        return ResponseEntity.ok(Map.of("active", surgeService.isSurgeActive(), "message", "Surge " + (enabled ? "enabled" : "disabled")));
    }
}
