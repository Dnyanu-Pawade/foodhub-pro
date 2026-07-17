package com.foodhub.loyalty.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_transactions")
@Data
@NoArgsConstructor
public class LoyaltyTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private LoyaltyAccount account;

    @Enumerated(EnumType.STRING)
    private TxType type;

    private int points;
    private int balanceAfter;
    private String description;
    private Long referenceOrderId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum TxType { EARN, REDEEM, EXPIRE, BONUS }
}
