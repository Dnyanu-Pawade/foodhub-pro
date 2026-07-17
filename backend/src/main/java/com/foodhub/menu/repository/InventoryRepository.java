package com.foodhub.menu.repository;

import com.foodhub.menu.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByRestaurantId(Long restaurantId);
    List<InventoryItem> findByRestaurantIdAndQuantityLessThan(Long restaurantId, Double threshold);
}
