package com.foodhub.coupon.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    private String description;

    @Enumerated(EnumType.STRING)
    private DiscountType discountType;

    @Column(precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount; // cap for percentage coupons

    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderAmount;

    private Integer maxUsageCount;   // total uses allowed
    private Integer usedCount = 0;
    private Integer maxUsagePerUser; // per-user limit

    private LocalDateTime validFrom;
    private LocalDateTime validUntil;

    private boolean isActive = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum DiscountType { PERCENTAGE, FLAT }
}
