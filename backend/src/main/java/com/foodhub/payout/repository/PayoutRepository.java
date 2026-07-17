package com.foodhub.payout.repository;

import com.foodhub.payout.entity.PayoutRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PayoutRepository extends JpaRepository<PayoutRequest, Long> {
    List<PayoutRequest> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
    List<PayoutRequest> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.restaurant.id = :rid AND o.status = 'DELIVERED'")
    BigDecimal totalRevenue(@Param("rid") Long restaurantId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PayoutRequest p WHERE p.restaurant.id = :rid AND p.status = 'COMPLETED'")
    BigDecimal totalPaidOut(@Param("rid") Long restaurantId);
}
