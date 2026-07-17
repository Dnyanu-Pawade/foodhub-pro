package com.foodhub.subscription.entity;

import com.foodhub.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Data
@NoArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private Plan plan = Plan.FREE;

    private LocalDateTime expiresAt;
    private String razorpaySubscriptionId;
    private boolean active = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum Plan { FREE, PRO }

    public boolean isProActive() {
        return active && plan == Plan.PRO && expiresAt != null && expiresAt.isAfter(LocalDateTime.now());
    }
}
