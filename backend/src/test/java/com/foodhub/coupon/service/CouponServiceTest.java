package com.foodhub.coupon.service;

import com.foodhub.auth.repository.UserRepository;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.coupon.dto.CouponApplyRequest;
import com.foodhub.coupon.dto.CouponApplyResponse;
import com.foodhub.coupon.entity.Coupon;
import com.foodhub.coupon.entity.Coupon.DiscountType;
import com.foodhub.coupon.repository.CouponRepository;
import com.foodhub.coupon.repository.CouponUsageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock CouponRepository couponRepository;
    @Mock CouponUsageRepository couponUsageRepository;
    @Mock UserRepository userRepository;
    @InjectMocks CouponService couponService;

    private Coupon buildCoupon(DiscountType type, double value) {
        Coupon c = new Coupon();
        c.setId(1L); c.setCode("TEST20");
        c.setDiscountType(type); c.setDiscountValue(BigDecimal.valueOf(value));
        c.setActive(true); c.setUsedCount(0);
        return c;
    }

    @Test
    void apply_percentageDiscount_success() {
        Coupon coupon = buildCoupon(DiscountType.PERCENTAGE, 20);
        coupon.setMinOrderAmount(BigDecimal.valueOf(100));

        CouponApplyRequest req = new CouponApplyRequest();
        req.setCode("TEST20"); req.setOrderAmount(BigDecimal.valueOf(500));

        when(couponRepository.findByCodeAndIsActiveTrue("TEST20")).thenReturn(Optional.of(coupon));
        when(couponUsageRepository.countByCouponId(1L)).thenReturn(0L);
        when(couponUsageRepository.countByCouponIdAndUserId(1L, 1L)).thenReturn(0L);

        CouponApplyResponse res = couponService.apply(req, 1L);
        assertThat(res.getDiscountAmount()).isEqualByComparingTo(BigDecimal.valueOf(100));
        assertThat(res.getFinalAmount()).isEqualByComparingTo(BigDecimal.valueOf(400));
    }

    @Test
    void apply_flatDiscount_success() {
        Coupon coupon = buildCoupon(DiscountType.FLAT, 50);

        CouponApplyRequest req = new CouponApplyRequest();
        req.setCode("TEST20"); req.setOrderAmount(BigDecimal.valueOf(300));

        when(couponRepository.findByCodeAndIsActiveTrue("TEST20")).thenReturn(Optional.of(coupon));
        when(couponUsageRepository.countByCouponId(1L)).thenReturn(0L);
        when(couponUsageRepository.countByCouponIdAndUserId(1L, 1L)).thenReturn(0L);

        CouponApplyResponse res = couponService.apply(req, 1L);
        assertThat(res.getDiscountAmount()).isEqualByComparingTo(BigDecimal.valueOf(50));
    }

    @Test
    void apply_invalidCode_throws() {
        when(couponRepository.findByCodeAndIsActiveTrue("INVALID")).thenReturn(Optional.empty());

        CouponApplyRequest req = new CouponApplyRequest();
        req.setCode("INVALID"); req.setOrderAmount(BigDecimal.valueOf(200));

        assertThatThrownBy(() -> couponService.apply(req, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid or expired");
    }

    @Test
    void apply_belowMinOrder_throws() {
        Coupon coupon = buildCoupon(DiscountType.PERCENTAGE, 10);
        coupon.setMinOrderAmount(BigDecimal.valueOf(500));

        CouponApplyRequest req = new CouponApplyRequest();
        req.setCode("TEST20"); req.setOrderAmount(BigDecimal.valueOf(100));

        when(couponRepository.findByCodeAndIsActiveTrue("TEST20")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> couponService.apply(req, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Minimum order amount");
    }
}
