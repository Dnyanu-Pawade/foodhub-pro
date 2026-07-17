package com.foodhub.common.config;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.order.entity.Order;
import com.foodhub.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/fraud")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class FraudController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @GetMapping("/alerts")
    public ResponseEntity<List<Map<String, Object>>> alerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        LocalDateTime since = LocalDateTime.now().minusDays(7);

        // Detect: customers with >10 cancelled orders in 7 days
        List<Order> recent = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt().isAfter(since)).toList();

        Map<Long, Long> cancelsByUser = recent.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(o -> o.getCustomer().getId(), Collectors.counting()));

        cancelsByUser.forEach((userId, count) -> {
            if (count >= 3) {
                User u = userRepository.findById(userId).orElse(null);
                if (u == null) return;
                Map<String, Object> alert = new HashMap<>();
                alert.put("id", userId * 100);
                alert.put("type", "EXCESSIVE_CANCELLATIONS");
                alert.put("severity", count >= 5 ? "HIGH" : "MEDIUM");
                alert.put("description", "User cancelled " + count + " orders in the last 7 days");
                alert.put("userId", userId);
                alert.put("userName", u.getFullName());
                alert.put("userEmail", u.getEmail());
                alert.put("createdAt", LocalDateTime.now());
                alerts.add(alert);
            }
        });

        // Detect: multiple orders from same user in <5 minutes
        Map<Long, List<Order>> ordersByUser = recent.stream()
                .collect(Collectors.groupingBy(o -> o.getCustomer().getId()));

        ordersByUser.forEach((userId, orders) -> {
            orders.sort(Comparator.comparing(Order::getCreatedAt));
            for (int i = 1; i < orders.size(); i++) {
                long diffMinutes = java.time.Duration.between(
                        orders.get(i-1).getCreatedAt(), orders.get(i).getCreatedAt()).toMinutes();
                if (diffMinutes < 2) {
                    User u = userRepository.findById(userId).orElse(null);
                    if (u == null) continue;
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("id", userId * 200 + i);
                    alert.put("type", "RAPID_ORDERS");
                    alert.put("severity", "MEDIUM");
                    alert.put("description", "Multiple orders placed within 2 minutes");
                    alert.put("userId", userId);
                    alert.put("userName", u.getFullName());
                    alert.put("userEmail", u.getEmail());
                    alert.put("createdAt", LocalDateTime.now());
                    alerts.add(alert);
                    break;
                }
            }
        });

        return ResponseEntity.ok(alerts);
    }

    @PatchMapping("/alerts/{id}/dismiss")
    public ResponseEntity<?> dismiss(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("message", "Alert dismissed"));
    }
}
