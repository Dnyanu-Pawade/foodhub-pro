package com.foodhub.restaurant.dto;

import com.foodhub.restaurant.entity.Restaurant.RestaurantStatus;
import com.foodhub.restaurant.entity.Restaurant.StoreType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class RestaurantDto {
    private Long id;
    @NotBlank private String name;
    private String description;
    private String cuisineType;
    private StoreType storeType;
    private String address;
    private String city;
    private String pincode;
    private Double latitude;
    private Double longitude;
    private String phone;
    private String email;
    private String logoUrl;
    private String bannerUrl;
    private java.util.List<String> photoUrls;
    private Double avgRating;
    private Integer totalRatings;
    private Integer avgDeliveryTimeMinutes;
    private Double deliveryFee;
    private Double minOrderAmount;
    private LocalTime openTime;
    private LocalTime closeTime;
    private RestaurantStatus status;
    private boolean isActive;
    private boolean isOpen;
    private boolean isPromoted;
    private Integer recentOrderCount;
    private String  mostOrderedItem;
    private LocalDateTime createdAt;
}
