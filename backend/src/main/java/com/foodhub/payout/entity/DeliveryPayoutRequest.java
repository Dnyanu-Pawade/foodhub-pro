package com.foodhub.payout.entity;

import com.foodhub.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_payout_requests")
@Data
@NoArgsConstructor
public class DeliveryPayoutRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id")
    private User partner;

    private BigDecimal amount;
    private String bankAccount;
    private String ifscCode;
    private String accountHolderName;
    private String upiId;

    @Enumerated(EnumType.STRING)
    private PayoutStatus status = PayoutStatus.PENDING;

    private String adminNote;

    @CreationTimestamp
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    public enum PayoutStatus { PENDING, PROCESSING, COMPLETED, REJECTED }
}
