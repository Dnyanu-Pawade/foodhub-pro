package com.foodhub.review.repository;

import com.foodhub.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
    Optional<Review> findByCustomerIdAndRestaurantId(Long customerId, Long restaurantId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.restaurant.id = :restaurantId")
    Double avgRatingByRestaurant(@Param("restaurantId") Long restaurantId);

    long countByRestaurantId(Long restaurantId);
}
