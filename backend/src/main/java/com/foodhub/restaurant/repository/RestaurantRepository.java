package com.foodhub.restaurant.repository;

import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.entity.Restaurant.RestaurantStatus;
import com.foodhub.restaurant.entity.Restaurant.StoreType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.Modifying;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    // Open or close all approved active restaurants
    @Modifying
    @Query("UPDATE Restaurant r SET r.isOpen = :open WHERE r.status = 'APPROVED' AND r.isActive = true AND r.deletedAt IS NULL")
    int setAllOpen(@Param("open") boolean open);

    // Keep old methods for compatibility but they won't be called
    @Modifying
    @Query("UPDATE Restaurant r SET r.isOpen = true WHERE r.status = 'APPROVED' AND r.isActive = true AND r.deletedAt IS NULL AND r.openTime IS NOT NULL AND r.closeTime IS NOT NULL AND r.openTime <= :now AND r.closeTime > :now AND r.isOpen = false")
    int openByTime(@Param("now") java.time.LocalTime now);

    @Modifying
    @Query("UPDATE Restaurant r SET r.isOpen = false WHERE r.status = 'APPROVED' AND r.isActive = true AND r.deletedAt IS NULL AND r.openTime IS NOT NULL AND r.closeTime IS NOT NULL AND (r.closeTime <= :now OR r.openTime > :now) AND r.isOpen = true")
    int closeByTime(@Param("now") java.time.LocalTime now);

    Page<Restaurant> findByStatusAndIsActiveTrue(RestaurantStatus status, Pageable pageable);
    long countByStatus(RestaurantStatus status);

    @Query("""
        SELECT r FROM Restaurant r
        WHERE r.status = 'APPROVED' AND r.isActive = true
        AND r.deletedAt IS NULL
        AND (:city IS NULL OR LOWER(r.city) = LOWER(:city))
        AND (:storeType IS NULL OR r.storeType = :storeType)
        AND (:search IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(r.cuisineType) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:vegOnly IS NULL OR :vegOnly = false OR EXISTS (
             SELECT 1 FROM MenuItem m WHERE m.restaurant = r AND m.isVeg = true AND m.deletedAt IS NULL))
        AND (:maxDeliveryFee IS NULL OR r.deliveryFee <= :maxDeliveryFee)
        AND (:minRating IS NULL OR r.avgRating >= :minRating)
        AND (:openNow IS NULL OR :openNow = false OR r.isOpen = true)
        ORDER BY
          CASE WHEN :sortBy = 'rating' THEN r.avgRating END DESC,
          CASE WHEN :sortBy = 'delivery_time' THEN r.avgDeliveryTimeMinutes END ASC,
          CASE WHEN :sortBy = 'delivery_fee' THEN r.deliveryFee END ASC,
          r.id DESC
        """)
    Page<Restaurant> search(@Param("city") String city,
                            @Param("storeType") StoreType storeType,
                            @Param("search") String search,
                            @Param("vegOnly") Boolean vegOnly,
                            @Param("maxDeliveryFee") Double maxDeliveryFee,
                            @Param("minRating") Double minRating,
                            @Param("openNow") Boolean openNow,
                            @Param("sortBy") String sortBy,
                            Pageable pageable);

    List<Restaurant> findByOwnerIdAndDeletedAtIsNull(Long ownerId);

    List<Restaurant> findByStatusAndDeletedAtIsNull(RestaurantStatus status);

    Optional<Restaurant> findByIdAndDeletedAtIsNull(Long id);

    @Query("SELECT DISTINCT r.city FROM Restaurant r WHERE r.status = 'APPROVED' AND r.isActive = true AND r.city IS NOT NULL ORDER BY r.city")
    List<String> findDistinctCities();
}
