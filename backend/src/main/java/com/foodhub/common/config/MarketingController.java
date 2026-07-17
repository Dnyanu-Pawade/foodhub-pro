package com.foodhub.common.config;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.notification.service.NotificationHelper;
import com.foodhub.notification.entity.Notification.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/admin/marketing")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class MarketingController {

    private final UserRepository userRepository;
    private final NotificationHelper notificationHelper;

    private static final List<Map<String, Object>> CAMPAIGNS = new CopyOnWriteArrayList<>();

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(Map.of(
            "pushSent",      CAMPAIGNS.stream().filter(c -> "PUSH".equals(c.get("channel"))).mapToLong(c -> (long) c.getOrDefault("sentCount", 0)).sum(),
            "emailsSent",    CAMPAIGNS.stream().filter(c -> "EMAIL".equals(c.get("channel"))).mapToLong(c -> (long) c.getOrDefault("sentCount", 0)).sum(),
            "smsSent",       CAMPAIGNS.stream().filter(c -> "SMS".equals(c.get("channel"))).mapToLong(c -> (long) c.getOrDefault("sentCount", 0)).sum(),
            "activeCoupons", 0
        ));
    }

    @GetMapping("/campaigns")
    public ResponseEntity<List<Map<String, Object>>> list() {
        return ResponseEntity.ok(CAMPAIGNS);
    }

    @PostMapping("/campaigns")
    public ResponseEntity<?> send(@RequestBody Map<String, Object> body) {
        String title      = (String) body.get("title");
        String message    = (String) body.get("message");
        String channel    = (String) body.getOrDefault("channel", "PUSH");
        String targetRole = (String) body.getOrDefault("targetRole", "ROLE_CUSTOMER");

        List<User> targets = "ALL".equals(targetRole)
                ? userRepository.findAll()
                : userRepository.findByRoleName(targetRole);

        if ("PUSH".equals(channel)) {
            targets.forEach(u -> notificationHelper.push(u.getId(), title, message, NotificationType.OFFER, "/", null));
        }

        Map<String, Object> campaign = new HashMap<>(body);
        campaign.put("id", System.currentTimeMillis());
        campaign.put("sentCount", (long) targets.size());
        campaign.put("createdAt", LocalDateTime.now());
        CAMPAIGNS.add(0, campaign);

        return ResponseEntity.ok(Map.of("message", "Campaign sent to " + targets.size() + " users"));
    }
}
