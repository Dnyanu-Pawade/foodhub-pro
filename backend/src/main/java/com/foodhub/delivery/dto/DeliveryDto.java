package com.foodhub.delivery.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class DeliveryDto {
    private Long id;
    private Long orderId;
    private Long partnerId;
    private String partnerName;
    private String status;
    private Double currentLatitude;
    private Double currentLongitude;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
    private String restaurantName;
    private String restaurantAddress;
    private String deliveryAddress;
    private BigDecimal totalAmount;
    private String deliveryPhotoUrl;
}
