package com.foodhub.common.config;

import com.foodhub.order.entity.Order;
import com.foodhub.order.repository.OrderRepository;
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

@RestController
@RequestMapping("/api/owner/gst-report")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
@RequiredArgsConstructor
public class OwnerGstController {

    private final OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> report(
            @RequestParam Long restaurantId,
            @RequestParam String month) {

        YearMonth ym = YearMonth.parse(month);
        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to   = ym.atEndOfMonth().atTime(23, 59, 59);

        List<Order> orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId).stream()
                .filter(o -> o.getCreatedAt().isAfter(from) && o.getCreatedAt().isBefore(to)
                          && o.getStatus() == Order.OrderStatus.DELIVERED)
                .toList();

        BigDecimal totalSales    = orders.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal taxableAmount = totalSales.divide(BigDecimal.valueOf(1.05), 2, RoundingMode.HALF_UP);
        BigDecimal totalGst      = totalSales.subtract(taxableAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal cgst          = totalGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal sgst          = cgst;

        // Daily breakdown
        List<Map<String, Object>> daily = new ArrayList<>();
        for (int i = 1; i <= ym.lengthOfMonth(); i++) {
            LocalDate date = ym.atDay(i);
            List<Order> dayOrders = orders.stream()
                    .filter(o -> o.getCreatedAt().toLocalDate().equals(date)).toList();
            if (dayOrders.isEmpty()) continue;
            BigDecimal sales = dayOrders.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal taxable = sales.divide(BigDecimal.valueOf(1.05), 2, RoundingMode.HALF_UP);
            BigDecimal gst = sales.subtract(taxable).setScale(2, RoundingMode.HALF_UP);
            Map<String, Object> row = new HashMap<>();
            row.put("date", date.toString());
            row.put("orders", dayOrders.size());
            row.put("sales", sales);
            row.put("cgst", gst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP));
            row.put("sgst", gst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP));
            row.put("totalTax", gst);
            daily.add(row);
        }

        return ResponseEntity.ok(Map.of(
            "totalSales",      totalSales,
            "taxableAmount",   taxableAmount,
            "cgst",            cgst,
            "sgst",            sgst,
            "dailyBreakdown",  daily
        ));
    }
}
