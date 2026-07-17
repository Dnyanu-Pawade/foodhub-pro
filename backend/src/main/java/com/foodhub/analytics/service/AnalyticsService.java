package com.foodhub.analytics.service;

import com.foodhub.analytics.dto.DashboardStats;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.order.entity.Order;
import com.foodhub.order.entity.Order.OrderStatus;
import com.foodhub.order.repository.OrderRepository;
import com.foodhub.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;

    public DashboardStats getAdminStats() {
        List<Order> allOrders = orderRepository.findAll();

        BigDecimal revenue = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> byStatus = Arrays.stream(OrderStatus.values())
                .collect(Collectors.toMap(
                        Enum::name,
                        s -> allOrders.stream().filter(o -> o.getStatus() == s).count()));

        return new DashboardStats(
                allOrders.size(),
                byStatus.getOrDefault("PLACED", 0L),
                byStatus.getOrDefault("DELIVERED", 0L),
                revenue,
                userRepository.count(),
                restaurantRepository.count(),
                byStatus);
    }

    public Map<String, BigDecimal> getDailyGmv(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            result.put(LocalDate.now().minusDays(i).toString(), BigDecimal.ZERO);
        }
        orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED && o.getCreatedAt().isAfter(since))
                .forEach(o -> {
                    String day = o.getCreatedAt().toLocalDate().toString();
                    result.merge(day, o.getTotalAmount(), BigDecimal::add);
                });
        return result;
    }

    public List<Map<String, Object>> getTopRestaurants(int limit) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .collect(Collectors.groupingBy(o -> o.getRestaurant().getId(), Collectors.toList()))
                .entrySet().stream()
                .map(e -> {
                    List<Order> orders = e.getValue();
                    BigDecimal rev = orders.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    Map<String, Object> m = new HashMap<>();
                    m.put("restaurantId", e.getKey());
                    m.put("name", orders.get(0).getRestaurant().getName());
                    m.put("orders", orders.size());
                    m.put("revenue", rev);
                    return m;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue")))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getTopCustomers(int limit) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .collect(Collectors.groupingBy(o -> o.getCustomer().getId(), Collectors.toList()))
                .entrySet().stream()
                .map(e -> {
                    List<Order> orders = e.getValue();
                    BigDecimal clv = orders.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    var customer = orders.get(0).getCustomer();
                    Map<String, Object> m = new HashMap<>();
                    m.put("userId", e.getKey());
                    m.put("name", customer.getFullName() != null ? customer.getFullName() : customer.getUsername());
                    m.put("orders", orders.size());
                    m.put("clv", clv);
                    return m;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("clv")).compareTo((BigDecimal) a.get("clv")))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public Map<String, Long> getOrdersByCity() {
        return orderRepository.findAll().stream()
                .filter(o -> o.getRestaurant().getCity() != null)
                .collect(Collectors.groupingBy(
                        o -> o.getRestaurant().getCity(),
                        Collectors.counting()));
    }
}
