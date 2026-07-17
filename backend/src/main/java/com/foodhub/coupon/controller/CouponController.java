package com.foodhub.coupon.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.dto.ApiResponse;
import com.foodhub.coupon.dto.CouponApplyRequest;
import com.foodhub.coupon.dto.CouponApplyResponse;
import com.foodhub.coupon.entity.Coupon;
import com.foodhub.coupon.service.CouponService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Coupons")
public class CouponController {

    private final CouponService couponService;

    @PostMapping("/api/coupons/apply")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CouponApplyResponse> apply(@Valid @RequestBody CouponApplyRequest request,
                                                     @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(couponService.apply(request, user.getId()));
    }

    @GetMapping("/api/coupons/active")
    public ResponseEntity<List<Coupon>> getActive() {
        return ResponseEntity.ok(couponService.getAll().stream()
                .filter(Coupon::isActive).toList());
    }

    @GetMapping("/api/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Coupon>> getAll() {
        return ResponseEntity.ok(couponService.getAll());
    }

    @PostMapping("/api/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Coupon> create(@RequestBody Coupon coupon) {
        return ResponseEntity.ok(couponService.create(coupon));
    }

    @DeleteMapping("/api/admin/coupons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deactivate(@PathVariable Long id) {
        couponService.deactivate(id);
        return ResponseEntity.ok(new ApiResponse(true, "Coupon deactivated"));
    }
}
