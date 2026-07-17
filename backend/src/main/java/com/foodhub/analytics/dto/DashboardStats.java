package com.foodhub.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
@AllArgsConstructor
public class DashboardStats {
    private long totalOrders;
    private long pendingOrders;
    private long deliveredOrders;
    private BigDecimal totalRevenue;
    private long totalCustomers;
    private long totalRestaurants;
    private Map<String, Long> ordersByStatus;
}
