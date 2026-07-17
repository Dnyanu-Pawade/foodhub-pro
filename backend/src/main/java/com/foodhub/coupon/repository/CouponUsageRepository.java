package com.foodhub.coupon.repository;

import com.foodhub.coupon.entity.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    long countByCouponId(Long couponId);
    long countByCouponIdAndUserId(Long couponId, Long userId);
}
