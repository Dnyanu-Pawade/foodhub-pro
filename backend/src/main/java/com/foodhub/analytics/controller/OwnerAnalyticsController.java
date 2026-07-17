package com.foodhub.analytics.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.order.entity.Order;
import com.foodhub.order.entity.Order.OrderStatus;
import com.foodhub.order.entity.OrderItem;
import com.foodhub.order.repository.OrderRepository;
import com.foodhub.restaurant.repository.RestaurantRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/owner/analytics")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
@RequiredArgsConstructor
@Tag(name = "Owner Analytics")
public class OwnerAnalyticsController {

    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;

    @GetMapping("/{restaurantId}")
    public ResponseEntity<Map<String, Object>> analytics(
            @PathVariable Long restaurantId,
            @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal UserDetailsImpl user) {

        List<Order> orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Order> recent = orders.stream()
                .filter(o -> o.getCreatedAt().isAfter(since)).toList();
        List<Order> delivered = recent.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED).toList();

        // Daily revenue for chart
        Map<String, BigDecimal> dailyRevenue = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            BigDecimal rev = delivered.stream()
                    .filter(o -> o.getCreatedAt().toLocalDate().equals(date))
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dailyRevenue.put(date.toString(), rev);
        }

        // Top selling items
        Map<String, Long> itemCounts = recent.stream()
                .flatMap(o -> o.getOrderItems().stream())
                .collect(Collectors.groupingBy(OrderItem::getItemName, Collectors.counting()));
        List<Map<String, Object>> topItems = itemCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> Map.<String, Object>of("name", e.getKey(), "count", e.getValue()))
                .toList();

        // Peak hours (0-23)
        Map<Integer, Long> peakHours = recent.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().getHour(), Collectors.counting()));

        // Summary stats
        BigDecimal totalRevenue = delivered.stream()
                .map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalOrders   = recent.size();
        long pendingOrders = recent.stream().filter(o -> o.getStatus() == OrderStatus.PLACED).count();
        double acceptRate  = totalOrders > 0
                ? (double) delivered.size() / totalOrders * 100 : 0;

        // Today stats
        LocalDate today = LocalDate.now();
        BigDecimal todayRevenue = delivered.stream()
                .filter(o -> o.getCreatedAt().toLocalDate().equals(today))
                .map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long todayOrders = recent.stream()
                .filter(o -> o.getCreatedAt().toLocalDate().equals(today)).count();

        return ResponseEntity.ok(Map.of(
            "totalRevenue",   totalRevenue,
            "totalOrders",    totalOrders,
            "pendingOrders",  pendingOrders,
            "deliveredOrders", delivered.size(),
            "acceptanceRate", Math.round(acceptRate),
            "todayRevenue",   todayRevenue,
            "todayOrders",    todayOrders,
            "dailyRevenue",   dailyRevenue,
            "topItems",       topItems,
            "peakHours",      peakHours
        ));
    }
}
