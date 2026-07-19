package com.foodhub.notification.entity;

import com.foodhub.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationType type = NotificationType.INFO;

    @Column(name = "is_read")
    private boolean read = false;
    private String actionUrl;
    private Long referenceId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum NotificationType {
        ORDER_UPDATE, OFFER, SYSTEM, INFO, DELIVERY_UPDATE
    }
}
