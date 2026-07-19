package com.foodhub.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentVerifyRequest {
    private Long orderId;          // optional — looked up via razorpayOrderId
    @NotBlank private String razorpayOrderId;
    private String razorpayPaymentId;   // nullable in simulate mode
    private String razorpaySignature;   // nullable in simulate mode
}
