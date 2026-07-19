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
    @Query("UPDATE Restaurant r SET r.open = :open WHERE r.status = 'APPROVED' AND r.active = true AND r.deletedAt IS NULL")
    int setAllOpen(@Param("open") boolean open);

    @Modifying
    @Query("UPDATE Restaurant r SET r.open = true WHERE r.status = 'APPROVED' AND r.active = true AND r.deletedAt IS NULL AND r.openTime IS NOT NULL AND r.closeTime IS NOT NULL AND r.openTime <= :now AND r.closeTime > :now AND r.open = false")
    int openByTime(@Param("now") java.time.LocalTime now);

    @Modifying
    @Query("UPDATE Restaurant r SET r.open = false WHERE r.status = 'APPROVED' AND r.active = true AND r.deletedAt IS NULL AND r.openTime IS NOT NULL AND r.closeTime IS NOT NULL AND (r.closeTime <= :now OR r.openTime > :now) AND r.open = true")
    int closeByTime(@Param("now") java.time.LocalTime now);

    Page<Restaurant> findByStatusAndActiveTrue(RestaurantStatus status, Pageable pageable);
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
             SELECT 1 FROM MenuItem m WHERE m.restaurant = r AND m.veg = true AND m.deletedAt IS NULL))
        AND (:maxDeliveryFee IS NULL OR r.deliveryFee <= :maxDeliveryFee)
        AND (:minRating IS NULL OR r.avgRating >= :minRating)
        AND (:openNow IS NULL OR :openNow = false OR r.open = true)
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

    @Query("SELECT DISTINCT r.city FROM Restaurant r WHERE r.status = 'APPROVED' AND r.active = true AND r.city IS NOT NULL ORDER BY r.city")
    List<String> findDistinctCities();
}
