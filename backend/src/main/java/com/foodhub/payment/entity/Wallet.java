package com.foodhub.payment.entity;

import com.foodhub.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallets")
@Data
@NoArgsConstructor
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(precision = 10, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    // Cashback earned but locked for 7 days
    @Column(precision = 10, scale = 2)
    private BigDecimal pendingCashback = BigDecimal.ZERO;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Wallet(User user) {
        this.user = user;
        this.balance = BigDecimal.ZERO;
        this.pendingCashback = BigDecimal.ZERO;
    }
}
