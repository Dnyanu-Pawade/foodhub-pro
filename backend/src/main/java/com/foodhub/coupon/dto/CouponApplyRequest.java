package com.foodhub.coupon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CouponApplyRequest {
    @NotBlank private String code;
    @NotNull  private BigDecimal orderAmount;
}

