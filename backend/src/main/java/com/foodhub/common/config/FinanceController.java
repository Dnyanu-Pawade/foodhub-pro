package com.foodhub.common.config;

import com.foodhub.order.entity.Order;
import com.foodhub.order.entity.Order.OrderStatus;
import com.foodhub.order.repository.OrderRepository;
import com.foodhub.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/finance")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class FinanceController {

    private final OrderRepository orderRepository;

    @GetMapping("/monthly-report")
    public ResponseEntity<Map<String, Object>> monthlyReport(@RequestParam String month) {
        YearMonth ym = YearMonth.parse(month);
        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to   = ym.atEndOfMonth().atTime(23, 59, 59);

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt().isAfter(from) && o.getCreatedAt().isBefore(to)
                          && o.getStatus() == OrderStatus.DELIVERED)
                .toList();

        BigDecimal grossRevenue = orders.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal commissionRate = BigDecimal.valueOf(0.15);
        BigDecimal platformCommission = grossRevenue.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal restaurantPayouts  = grossRevenue.subtract(platformCommission).setScale(2, RoundingMode.HALF_UP);
        BigDecimal deliveryPayouts    = BigDecimal.valueOf(orders.size() * 30L);
        BigDecimal taxableAmount      = grossRevenue.divide(BigDecimal.valueOf(1.05), 2, RoundingMode.HALF_UP);
        BigDecimal totalGst           = grossRevenue.subtract(taxableAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal cgst               = totalGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal sgst               = cgst;
        BigDecimal netRevenue         = platformCommission.subtract(deliveryPayouts).setScale(2, RoundingMode.HALF_UP);

        // Daily revenue
        Map<String, BigDecimal> dailyRevenue = new LinkedHashMap<>();
        for (int i = 1; i <= ym.lengthOfMonth(); i++) {
            LocalDate date = ym.atDay(i);
            BigDecimal rev = orders.stream()
                    .filter(o -> o.getCreatedAt().toLocalDate().equals(date))
                    .map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            dailyRevenue.put(date.toString(), rev);
        }

        return ResponseEntity.ok(Map.of(
            "grossRevenue",       grossRevenue,
            "platformCommission", platformCommission,
            "restaurantPayouts",  restaurantPayouts,
            "deliveryPayouts",    deliveryPayouts,
            "taxableAmount",      taxableAmount,
            "cgst",               cgst,
            "sgst",               sgst,
            "totalRefunds",       BigDecimal.ZERO,
            "netRevenue",         netRevenue,
            "dailyRevenue",       dailyRevenue
        ));
    }

    @GetMapping("/refunds")
    public ResponseEntity<List<Map<String, Object>>> refunds() {
        // Return cancelled orders as refunds
        List<Map<String, Object>> refunds = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELLED)
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .limit(50)
                .map(o -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", o.getId());
                    m.put("orderId", o.getId());
                    m.put("customerName", o.getCustomer().getFullName());
                    m.put("amount", o.getTotalAmount());
                    m.put("reason", "Order cancelled");
                    m.put("status", "COMPLETED");
                    m.put("createdAt", o.getCreatedAt());
                    return m;
                }).toList();
        return ResponseEntity.ok(refunds);
    }
}
