package com.foodhub.order.dto;

import com.foodhub.order.entity.Order.OrderStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long restaurantId;
    private String restaurantName;
    private OrderStatus status;
    private String deliveryAddress;
    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private String couponCode;
    private String paymentMethod;
    private String paymentStatus;
    private String specialInstructions;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    // Map coordinates
    private Double restaurantLat;
    private Double restaurantLng;
    private Double deliveryLat;
    private Double deliveryLng;
    private Integer avgDeliveryTimeMinutes;
    private String deliveryOtp;
    private String deliveryPhotoUrl;
    private String scheduledAt;

    @Data
    public static class OrderItemResponse {
        private Long id;
        private Long menuItemId;
        private String itemName;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal totalPrice;
    }
}
