package com.foodhub.loyalty.controller;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.loyalty.entity.LoyaltyAccount;
import com.foodhub.loyalty.entity.LoyaltyTransaction;
import com.foodhub.loyalty.entity.LoyaltyTransaction.TxType;
import com.foodhub.loyalty.repository.LoyaltyRepository;
import com.foodhub.loyalty.repository.LoyaltyTransactionRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loyalty")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
@Tag(name = "Loyalty Points")
public class LoyaltyController {

    private final LoyaltyRepository loyaltyRepository;
    private final LoyaltyTransactionRepository txRepository;
    private final UserRepository userRepository;

    // 1 point per ₹10 spent, 1 point = ₹0.50 redemption value
    public static final int POINTS_PER_10_RS = 1;
    public static final double POINT_VALUE_RS = 0.50;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAccount(@AuthenticationPrincipal UserDetailsImpl user) {
        LoyaltyAccount acc = getOrCreate(user.getId());
        List<LoyaltyTransaction> history = txRepository.findByAccountIdOrderByCreatedAtDesc(acc.getId());
        return ResponseEntity.ok(Map.of(
            "totalPoints",     acc.getTotalPoints(),
            "redeemedPoints",  acc.getRedeemedPoints(),
            "availablePoints", acc.getAvailablePoints(),
            "worthRupees",     acc.getAvailablePoints() * POINT_VALUE_RS,
            "history",         history
        ));
    }

    @PostMapping("/redeem")
    @Transactional
    public ResponseEntity<Map<String, Object>> redeem(
            @RequestParam int points,
            @AuthenticationPrincipal UserDetailsImpl user) {
        LoyaltyAccount acc = getOrCreate(user.getId());
        if (points > acc.getAvailablePoints())
            throw new BadRequestException("Insufficient points. Available: " + acc.getAvailablePoints());
        if (points < 10)
            throw new BadRequestException("Minimum redemption is 10 points");

        acc.setRedeemedPoints(acc.getRedeemedPoints() + points);
        loyaltyRepository.save(acc);

        LoyaltyTransaction tx = new LoyaltyTransaction();
        tx.setAccount(acc);
        tx.setType(TxType.REDEEM);
        tx.setPoints(-points);
        tx.setBalanceAfter(acc.getAvailablePoints());
        tx.setDescription("Redeemed " + points + " points = ₹" + (points * POINT_VALUE_RS));
        txRepository.save(tx);

        return ResponseEntity.ok(Map.of(
            "pointsRedeemed", points,
            "discountAmount", points * POINT_VALUE_RS,
            "remainingPoints", acc.getAvailablePoints()
        ));
    }

    @Transactional
    public void earnPoints(Long userId, BigDecimal orderAmount, Long orderId) {
        LoyaltyAccount acc = getOrCreate(userId);
        int earned = (int)(orderAmount.doubleValue() / 10) * POINTS_PER_10_RS;
        if (earned <= 0) return;

        acc.setTotalPoints(acc.getTotalPoints() + earned);
        loyaltyRepository.save(acc);

        LoyaltyTransaction tx = new LoyaltyTransaction();
        tx.setAccount(acc);
        tx.setType(TxType.EARN);
        tx.setPoints(earned);
        tx.setBalanceAfter(acc.getAvailablePoints());
        tx.setDescription("Earned " + earned + " pts on order #" + orderId);
        tx.setReferenceOrderId(orderId);
        txRepository.save(tx);
    }

    private LoyaltyAccount getOrCreate(Long userId) {
        return loyaltyRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId).orElseThrow();
            LoyaltyAccount acc = new LoyaltyAccount();
            acc.setUser(user);
            return loyaltyRepository.save(acc);
        });
    }
}
