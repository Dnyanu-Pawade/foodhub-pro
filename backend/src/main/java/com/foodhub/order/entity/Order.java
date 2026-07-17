package com.foodhub.order.entity;

import com.foodhub.auth.entity.User;
import com.foodhub.restaurant.entity.Restaurant;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PLACED;

    private String deliveryAddress;
    private String deliveryCity;
    private String deliveryPincode;
    private Double deliveryLat;
    private Double deliveryLng;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    private String couponCode;
    private String paymentMethod;  // ONLINE | WALLET | COD
    private String paymentStatus;  // PENDING | PAID | FAILED | REFUNDED

    private String specialInstructions;
    private String deliveryOtp;
    private String tableNumber;
    private LocalDateTime scheduledAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;

    public enum OrderStatus {
        PLACED,
        CONFIRMED,
        REJECTED,
        PREPARING,
        READY_FOR_PICKUP,
        PICKED_UP,
        DELIVERED,
        CANCELLED
    }
}
