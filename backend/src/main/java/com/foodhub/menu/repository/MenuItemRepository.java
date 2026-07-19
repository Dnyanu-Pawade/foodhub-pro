package com.foodhub.menu.repository;

import com.foodhub.menu.entity.MenuItem;
import com.foodhub.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByRestaurantIdAndDeletedAtIsNull(Long restaurantId);
    List<MenuItem> findByRestaurantIdAndAvailableTrueAndDeletedAtIsNull(Long restaurantId);
    Optional<MenuItem> findByIdAndDeletedAtIsNull(Long id);

    @Query("""
        SELECT m FROM MenuItem m
        WHERE m.deletedAt IS NULL AND m.available = true
        AND m.restaurant.status = 'APPROVED'
        AND (:q IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%',:q,'%'))
             OR LOWER(m.category) LIKE LOWER(CONCAT('%',:q,'%')))
        ORDER BY m.name ASC
        """)
    List<MenuItem> searchDishes(@Param("q") String q);

    @Query("""
        SELECT DISTINCT m.name FROM MenuItem m
        WHERE m.deletedAt IS NULL AND m.available = true
        AND LOWER(m.name) LIKE LOWER(CONCAT('%',:q,'%'))
        ORDER BY m.name ASC
        LIMIT 8
        """)
    List<String> autocomplete(@Param("q") String q);

    @Query("""
        SELECT oi.itemName FROM OrderItem oi
        WHERE oi.order.restaurant.id = :restaurantId
        GROUP BY oi.itemName
        ORDER BY SUM(oi.quantity) DESC
        LIMIT 1
        """)
    Optional<String> findMostOrderedByRestaurant(@Param("restaurantId") Long restaurantId);
}
