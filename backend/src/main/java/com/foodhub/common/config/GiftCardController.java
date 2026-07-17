package com.foodhub.common.config;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.payment.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/gift-cards")
@RequiredArgsConstructor
public class GiftCardController {

    private final WalletService walletService;

    // In-memory store (replace with DB entity in production)
    private static final Map<String, Map<String, Object>> CARDS = new ConcurrentHashMap<>();

    @GetMapping("/my")
    public ResponseEntity<List<Map<String, Object>>> my(@AuthenticationPrincipal UserDetailsImpl user) {
        List<Map<String, Object>> mine = CARDS.values().stream()
                .filter(c -> user.getId().equals(c.get("ownerId")) || user.getEmail().equals(c.get("sentTo")))
                .toList();
        return ResponseEntity.ok(mine);
    }

    @PostMapping("/purchase")
    public ResponseEntity<?> purchase(@RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal UserDetailsImpl user) {
        String code = generateCode();
        Map<String, Object> card = new HashMap<>();
        card.put("id", System.currentTimeMillis());
        card.put("code", code);
        card.put("amount", body.get("amount"));
        card.put("sentTo", body.get("recipientEmail"));
        card.put("message", body.get("message"));
        card.put("ownerId", user.getId());
        card.put("redeemed", false);
        card.put("expiresAt", LocalDateTime.now().plusYears(1));
        CARDS.put(code, card);
        return ResponseEntity.ok(Map.of("message", "Gift card sent!", "code", code));
    }

    @PostMapping("/redeem")
    public ResponseEntity<?> redeem(@RequestBody Map<String, Object> body,
                                    @AuthenticationPrincipal UserDetailsImpl user) {
        String code = (String) body.get("code");
        Map<String, Object> card = CARDS.get(code);
        if (card == null) return ResponseEntity.badRequest().body(Map.of("message", "Invalid gift card code"));
        if (Boolean.TRUE.equals(card.get("redeemed"))) return ResponseEntity.badRequest().body(Map.of("message", "Gift card already redeemed"));
        BigDecimal amount = new BigDecimal(card.get("amount").toString());
        walletService.credit(user.getId(), amount, "Gift card redeemed: " + code);
        card.put("redeemed", true);
        return ResponseEntity.ok(Map.of("message", "Redeemed!", "amount", amount));
    }

    private String generateCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random r = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 16; i++) {
            if (i > 0 && i % 4 == 0) sb.append('-');
            sb.append(chars.charAt(r.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
