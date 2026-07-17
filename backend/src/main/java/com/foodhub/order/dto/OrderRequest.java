package com.foodhub.order.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {
    @NotNull  private Long restaurantId;
    @NotEmpty private List<OrderItemRequest> items;
    @NotNull  private String deliveryAddress;
    private String deliveryCity;
    private String deliveryPincode;
    private String couponCode;
    private String paymentMethod;
    private String specialInstructions;
    private Double deliveryLat;
    private Double deliveryLng;
    private String scheduledAt;
    // QR / guest order fields
    private String tableNumber;
    private String customerName;
    private String customerPhone;

    @Data
    public static class OrderItemRequest {
        @NotNull private Long menuItemId;
        @NotNull private Integer quantity;
    }
}
