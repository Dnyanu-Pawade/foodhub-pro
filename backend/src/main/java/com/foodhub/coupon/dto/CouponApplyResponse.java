package com.foodhub.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CouponApplyResponse {
    private String code;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String message;
}
