package com.foodhub.common.config;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final OrderRepository orderRepository;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> body,
                                                     @AuthenticationPrincipal UserDetailsImpl user) {
        String message = body.getOrDefault("message", "").toLowerCase();
        String reply;

        if (message.contains("track") || message.contains("order status")) {
            long active = orderRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId(),
                    org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
            reply = active > 0
                    ? "You have " + active + " order(s). Go to **Orders** page to track them live with GPS! 📍"
                    : "You have no active orders. Browse restaurants to place a new order! 🍽️";
        } else if (message.contains("cancel")) {
            reply = "You can cancel an order within **2 minutes** of placing it from the Orders page. After that, please contact support.";
        } else if (message.contains("refund")) {
            reply = "Refunds are processed within **5-7 business days** to your original payment method. Check your wallet for instant refunds!";
        } else if (message.contains("coupon") || message.contains("discount") || message.contains("offer")) {
            reply = "Try these codes: **FLAT50** (50% off up to ₹100), **FREEDEL** (free delivery), **WELCOME50** (first order 50% off)! 🎁";
        } else if (message.contains("wallet")) {
            reply = "Your wallet balance can be used for instant payments. Go to **Wallet** page to add money or view transactions! 💰";
        } else if (message.contains("loyalty") || message.contains("points")) {
            reply = "You earn **10 points per ₹100** spent. Redeem 100 points = ₹10 off. Check your points on the **Loyalty** page! ⭐";
        } else if (message.contains("delivery") || message.contains("time")) {
            reply = "Average delivery time is **30-45 minutes**. You can track your delivery partner live on the order tracking page! 🛵";
        } else if (message.contains("payment")) {
            reply = "We accept **UPI, Cards, Net Banking, Wallet, and Cash on Delivery**. All payments are 100% secure! 🔒";
        } else if (message.contains("hello") || message.contains("hi") || message.contains("hey")) {
            reply = "Hello! 👋 I'm FoodBot, your AI food assistant. Ask me about orders, refunds, coupons, or anything food-related!";
        } else {
            reply = "I'm here to help with orders, refunds, coupons, wallet, and more! You can also visit our **Support** page for complex issues. 😊";
        }

        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
