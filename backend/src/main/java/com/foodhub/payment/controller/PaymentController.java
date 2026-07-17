package com.foodhub.payment.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.dto.ApiResponse;
import com.foodhub.payment.dto.PaymentOrderResponse;
import com.foodhub.payment.dto.PaymentVerifyRequest;
import com.foodhub.payment.dto.WalletDto;
import com.foodhub.payment.service.PaymentService;
import com.foodhub.payment.service.WalletService;
import com.razorpay.RazorpayException;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments & Wallet")
public class PaymentController {

    private final PaymentService paymentService;
    private final WalletService walletService;

    @PostMapping("/orders/{orderId}/initiate")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PaymentOrderResponse> initiatePayment(@PathVariable Long orderId)
            throws RazorpayException {
        return ResponseEntity.ok(paymentService.createRazorpayOrder(orderId));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse> verifyPayment(@Valid @RequestBody PaymentVerifyRequest request) {
        paymentService.verifyAndCapture(request);
        return ResponseEntity.ok(new ApiResponse(true, "Payment successful"));
    }

    @GetMapping("/wallet")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<WalletDto> getWallet(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(walletService.getWallet(user.getId()));
    }

    @PostMapping("/wallet/topup/initiate")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PaymentOrderResponse> initiateTopup(
            @RequestParam double amount,
            @AuthenticationPrincipal UserDetailsImpl user) throws RazorpayException {
        return ResponseEntity.ok(paymentService.createWalletTopupOrder(user.getId(), amount));
    }

    @PostMapping("/wallet/topup/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse> verifyTopup(
            @Valid @RequestBody PaymentVerifyRequest request,
            @AuthenticationPrincipal UserDetailsImpl user) {
        paymentService.verifyAndCreditWallet(request, user.getId());
        return ResponseEntity.ok(new ApiResponse(true, "Wallet topped up successfully"));
    }
}
