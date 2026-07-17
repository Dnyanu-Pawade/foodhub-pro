package com.foodhub.delivery.dto;

import lombok.Data;

@Data
public class LocationUpdate {
    private Long orderId;
    private Double latitude;
    private Double longitude;
    private String status;
}
