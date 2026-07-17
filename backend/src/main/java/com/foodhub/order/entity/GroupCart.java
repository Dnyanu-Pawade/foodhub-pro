package com.foodhub.order.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_carts")
@Data
@NoArgsConstructor
public class GroupCart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 12)
    private String code; // 6-char share code e.g. "ABC123"

    private Long restaurantId;
    private String restaurantName;
    private Long createdByUserId;
    private String createdByName;

    @Column(columnDefinition = "TEXT")
    private String itemsJson; // JSON array of cart items

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
