package com.foodhub.auth.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, unique = true, nullable = false)
    private ERole name;

    public Role(ERole name) {
        this.name = name;
    }

    public enum ERole {
        ROLE_CUSTOMER,
        ROLE_RESTAURANT_OWNER,
        ROLE_DELIVERY_PARTNER,
        ROLE_ADMIN
    }
}
