package com.foodhub.payout.entity;

import com.foodhub.restaurant.entity.Restaurant;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payout_requests")
@Data
@NoArgsConstructor
public class PayoutRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    private BigDecimal amount;
    private String bankAccount;
    private String ifscCode;
    private String accountHolderName;

    @Enumerated(EnumType.STRING)
    private PayoutStatus status = PayoutStatus.PENDING;

    private String adminNote;

    @CreationTimestamp
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    public enum PayoutStatus { PENDING, PROCESSING, COMPLETED, REJECTED }
}
