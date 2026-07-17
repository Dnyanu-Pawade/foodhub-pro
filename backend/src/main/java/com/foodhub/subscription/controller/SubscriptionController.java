package com.foodhub.subscription.controller;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.notification.service.NotificationHelper;
import com.foodhub.notification.entity.Notification.NotificationType;
import com.foodhub.subscription.entity.Subscription;
import com.foodhub.subscription.repository.SubscriptionRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
@Tag(name = "Subscription")
public class SubscriptionController {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final NotificationHelper notificationHelper;

    @Value("${razorpay.key-id:rzp_test_dummy}")
    private String razorpayKeyId;

    private static final int PRO_PRICE_PAISE = 9900; // Rs.99

    @GetMapping("/status")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String, Object>> getStatus(@AuthenticationPrincipal UserDetailsImpl u) {
        Subscription sub = subscriptionRepository.findTopByUserIdOrderByCreatedAtDesc(u.getId()).orElse(null);
        boolean isPro = sub != null && sub.isProActive();
        return ResponseEntity.ok(Map.of(
                "isPro", isPro,
                "plan", sub != null ? sub.getPlan().name() : "FREE",
                "expiresAt", sub != null && sub.getExpiresAt() != null ? sub.getExpiresAt().toString() : "",
                "price", 99,
                "benefits", new String[]{"Free delivery on all orders", "10% extra discount", "Priority support", "Pro badge"}
        ));
    }

    // Initiate Razorpay order for subscription
    @PostMapping("/initiate")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String, Object>> initiate(@AuthenticationPrincipal UserDetailsImpl u) {
        // In production: create Razorpay order via SDK
        // For now return dummy order details
        return ResponseEntity.ok(Map.of(
                "keyId", razorpayKeyId,
                "amount", PRO_PRICE_PAISE,
                "currency", "INR",
                "orderId", "order_sub_" + u.getId() + "_" + System.currentTimeMillis(),
                "name", "FoodHub Pro",
                "description", "Monthly Pro Subscription"
        ));
    }

    // Verify payment and activate subscription
    @PostMapping("/activate")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional
    public ResponseEntity<Map<String, Object>> activate(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl u) {

        User user = userRepository.findById(u.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Subscription sub = subscriptionRepository.findTopByUserIdOrderByCreatedAtDesc(u.getId())
                .orElse(new Subscription());

        sub.setUser(user);
        sub.setPlan(Subscription.Plan.PRO);
        sub.setActive(true);
        sub.setExpiresAt(LocalDateTime.now().plusMonths(1));
        sub.setRazorpaySubscriptionId(body.getOrDefault("paymentId", "manual"));
        subscriptionRepository.save(sub);

        notificationHelper.push(u.getId(), "Welcome to FoodHub Pro! 🎉",
                "You now have free delivery + 10% discount on all orders for 30 days.",
                NotificationType.OFFER, "/subscription", null);

        return ResponseEntity.ok(Map.of("message", "Pro subscription activated!", "expiresAt", sub.getExpiresAt().toString()));
    }
}
