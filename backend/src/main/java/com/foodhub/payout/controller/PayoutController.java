package com.foodhub.payout.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.payout.entity.PayoutRequest;
import com.foodhub.payout.repository.PayoutRepository;
import com.foodhub.restaurant.repository.RestaurantRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Payouts")
public class PayoutController {

    private final PayoutRepository payoutRepository;
    private final RestaurantRepository restaurantRepository;

    private static final double COMMISSION_RATE = 0.15; // 15%

    // Owner: get payout summary for a restaurant
    @GetMapping("/api/owner/payouts/{restaurantId}/summary")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable Long restaurantId,
                                                           @AuthenticationPrincipal UserDetailsImpl u) {
        BigDecimal totalRevenue  = payoutRepository.totalRevenue(restaurantId);
        BigDecimal commission    = totalRevenue.multiply(BigDecimal.valueOf(COMMISSION_RATE));
        BigDecimal netEarnings   = totalRevenue.subtract(commission);
        BigDecimal totalPaidOut  = payoutRepository.totalPaidOut(restaurantId);
        BigDecimal pendingPayout = netEarnings.subtract(totalPaidOut).max(BigDecimal.ZERO);

        return ResponseEntity.ok(Map.of(
                "totalRevenue",   totalRevenue,
                "commission",     commission,
                "commissionRate", (int)(COMMISSION_RATE * 100),
                "netEarnings",    netEarnings,
                "totalPaidOut",   totalPaidOut,
                "pendingPayout",  pendingPayout
        ));
    }

    // Owner: list payout requests
    @GetMapping("/api/owner/payouts/{restaurantId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<List<PayoutRequest>> getPayouts(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(payoutRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId));
    }

    // Owner: request payout
    @PostMapping("/api/owner/payouts/{restaurantId}/request")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    @Transactional
    public ResponseEntity<PayoutRequest> requestPayout(@PathVariable Long restaurantId,
                                                        @RequestBody Map<String, String> body,
                                                        @AuthenticationPrincipal UserDetailsImpl u) {
        var restaurant = restaurantRepository.findByIdAndDeletedAtIsNull(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

        BigDecimal totalRevenue  = payoutRepository.totalRevenue(restaurantId);
        BigDecimal commission    = totalRevenue.multiply(BigDecimal.valueOf(COMMISSION_RATE));
        BigDecimal netEarnings   = totalRevenue.subtract(commission);
        BigDecimal totalPaidOut  = payoutRepository.totalPaidOut(restaurantId);
        BigDecimal pendingPayout = netEarnings.subtract(totalPaidOut).max(BigDecimal.ZERO);

        if (pendingPayout.compareTo(BigDecimal.valueOf(100)) < 0)
            throw new com.foodhub.common.exception.BadRequestException("Minimum payout amount is Rs.100");

        PayoutRequest req = new PayoutRequest();
        req.setRestaurant(restaurant);
        req.setAmount(pendingPayout);
        req.setBankAccount(body.get("bankAccount"));
        req.setIfscCode(body.get("ifscCode"));
        req.setAccountHolderName(body.get("accountHolderName"));
        return ResponseEntity.ok(payoutRepository.save(req));
    }

    // Admin: list all payout requests
    @GetMapping("/api/admin/payouts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PayoutRequest>> getAllPayouts() {
        return ResponseEntity.ok(payoutRepository.findAllByOrderByCreatedAtDesc());
    }

    // Admin: process payout
    @PatchMapping("/api/admin/payouts/{id}/process")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<PayoutRequest> processPayout(@PathVariable Long id,
                                                        @RequestParam PayoutRequest.PayoutStatus status,
                                                        @RequestParam(required = false) String note) {
        PayoutRequest req = payoutRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payout not found"));
        req.setStatus(status);
        req.setAdminNote(note);
        req.setProcessedAt(LocalDateTime.now());
        return ResponseEntity.ok(payoutRepository.save(req));
    }
}
