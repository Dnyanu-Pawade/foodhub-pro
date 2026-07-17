package com.foodhub.collection.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "food_collections")
@Data
@NoArgsConstructor
public class FoodCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;        // e.g. "Best Biryani in Pune"
    private String emoji;        // e.g. "🍱"
    private String description;
    private String imageUrl;
    private String tag;          // cuisine/category tag to filter restaurants e.g. "Biryani"
    private boolean active = true;
    private int displayOrder = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
