package com.foodhub.coupon.service;

import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.coupon.dto.CouponApplyRequest;
import com.foodhub.coupon.dto.CouponApplyResponse;
import com.foodhub.coupon.entity.Coupon;
import com.foodhub.coupon.entity.Coupon.DiscountType;
import com.foodhub.coupon.entity.CouponUsage;
import com.foodhub.coupon.repository.CouponRepository;
import com.foodhub.coupon.repository.CouponUsageRepository;
import com.foodhub.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final UserRepository userRepository;

    public CouponApplyResponse apply(CouponApplyRequest request, Long userId) {
        Coupon coupon = couponRepository.findByCodeAndIsActiveTrue(request.getCode())
                .orElseThrow(() -> new BadRequestException("Invalid or expired coupon code"));

        LocalDateTime now = LocalDateTime.now();
        if (coupon.getValidFrom() != null && now.isBefore(coupon.getValidFrom()))
            throw new BadRequestException("Coupon is not yet active");
        if (coupon.getValidUntil() != null && now.isAfter(coupon.getValidUntil()))
            throw new BadRequestException("Coupon has expired");
        if (coupon.getMinOrderAmount() != null
                && request.getOrderAmount().compareTo(coupon.getMinOrderAmount()) < 0)
            throw new BadRequestException("Minimum order amount ₹" + coupon.getMinOrderAmount() + " required");
        if (coupon.getMaxUsageCount() != null
                && couponUsageRepository.countByCouponId(coupon.getId()) >= coupon.getMaxUsageCount())
            throw new BadRequestException("Coupon usage limit reached");
        if (coupon.getMaxUsagePerUser() != null
                && couponUsageRepository.countByCouponIdAndUserId(coupon.getId(), userId)
                        >= coupon.getMaxUsagePerUser())
            throw new BadRequestException("You have already used this coupon");

        BigDecimal discount = calculateDiscount(coupon, request.getOrderAmount());
        BigDecimal finalAmount = request.getOrderAmount().subtract(discount).max(BigDecimal.ZERO);

        return new CouponApplyResponse(coupon.getCode(), discount, finalAmount,
                "Coupon applied! You save ₹" + discount);
    }

    @Transactional
    public void recordUsage(String code, Long userId, Long orderId) {
        couponRepository.findByCodeAndIsActiveTrue(code).ifPresent(coupon -> {
            CouponUsage usage = new CouponUsage();
            usage.setCoupon(coupon);
            usage.setUser(userRepository.findById(userId).orElseThrow());
            usage.setOrderId(orderId);
            couponUsageRepository.save(usage);
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        });
    }

    // Admin: create coupon
    @Transactional
    public Coupon create(Coupon coupon) {
        if (couponRepository.findByCodeAndIsActiveTrue(coupon.getCode()).isPresent())
            throw new BadRequestException("Coupon code already exists");
        return couponRepository.save(coupon);
    }

    public List<Coupon> getAll() { return couponRepository.findAll(); }

    @Transactional
    public void deactivate(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        coupon.setActive(false);
        couponRepository.save(coupon);
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal orderAmount) {
        if (coupon.getDiscountType() == DiscountType.FLAT) {
            return coupon.getDiscountValue().min(orderAmount);
        }
        BigDecimal discount = orderAmount.multiply(coupon.getDiscountValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        if (coupon.getMaxDiscountAmount() != null)
            discount = discount.min(coupon.getMaxDiscountAmount());
        return discount;
    }
}
