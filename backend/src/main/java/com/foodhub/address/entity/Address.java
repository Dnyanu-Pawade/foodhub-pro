package com.foodhub.address.entity;

import com.foodhub.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "addresses")
@Data
@NoArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String label;       // Home, Work, Other
    private String fullAddress;
    private String city;
    private String pincode;
    private Double latitude;
    private Double longitude;
    private boolean isDefault = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
