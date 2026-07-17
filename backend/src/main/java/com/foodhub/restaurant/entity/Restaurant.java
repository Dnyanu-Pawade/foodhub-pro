package com.foodhub.restaurant.entity;

import com.foodhub.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "restaurants")
@Data
@NoArgsConstructor
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String cuisineType;

    @Enumerated(EnumType.STRING)
    private StoreType storeType = StoreType.RESTAURANT;

    private String address;
    private String city;
    private String pincode;
    private Double latitude;
    private Double longitude;

    private String phone;
    private String email;

    private String logoUrl;
    private String bannerUrl;

    @Column(columnDefinition = "TEXT")
    private String photoUrlsJson; // JSON array of photo URLs

    private Double avgRating = 0.0;
    private Integer totalRatings = 0;

    private Integer avgDeliveryTimeMinutes = 30;
    private Double deliveryFee = 0.0;
    private Double minOrderAmount = 0.0;

    private LocalTime openTime;
    private LocalTime closeTime;

    @Enumerated(EnumType.STRING)
    private RestaurantStatus status = RestaurantStatus.PENDING_APPROVAL;

    private boolean isActive = true;
    private boolean isOpen = true;
    private boolean isPromoted = false;
    private LocalDateTime promotedUntil;
    private LocalDateTime deletedAt;
    private Double commissionRate = 15.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;

    public enum StoreType { RESTAURANT, GROCERY, PHARMACY }
    public enum RestaurantStatus { PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED }
}
