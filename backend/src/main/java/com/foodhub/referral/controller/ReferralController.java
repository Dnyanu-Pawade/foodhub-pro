package com.foodhub.referral.controller;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.notification.service.NotificationHelper;
import com.foodhub.notification.entity.Notification.NotificationType;
import com.foodhub.payment.service.WalletService;
import com.foodhub.referral.entity.Referral;
import com.foodhub.referral.repository.ReferralRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/referral")
@RequiredArgsConstructor
@Tag(name = "Referral")
public class ReferralController {

    private final UserRepository userRepository;
    private final ReferralRepository referralRepository;
    private final WalletService walletService;
    private final NotificationHelper notificationHelper;

    private static final BigDecimal REWARD = BigDecimal.valueOf(50);

    // Get or generate referral code for current user
    @GetMapping("/my-code")
    public ResponseEntity<Map<String, String>> getMyCode(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getReferralCode() == null) {
            user.setReferralCode(user.getUsername().toUpperCase() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
            userRepository.save(user);
        }
        long successfulReferrals = referralRepository.countByReferrerIdAndRewardCreditedTrue(user.getId());
        return ResponseEntity.ok(Map.of(
                "code", user.getReferralCode(),
                "shareText", "Use my code " + user.getReferralCode() + " on FoodHub Pro and get Rs.50 wallet credit!",
                "successfulReferrals", String.valueOf(successfulReferrals),
                "totalEarned", String.valueOf(successfulReferrals * 50)
        ));
    }

    // Apply referral code after registration (called by new user)
    @PostMapping("/apply")
    @Transactional
    public ResponseEntity<Map<String, String>> applyReferral(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        String code = body.get("code");
        if (code == null || code.isBlank()) throw new BadRequestException("Referral code required");

        // Check referee hasn't already used a referral
        if (referralRepository.findByRefereeId(userDetails.getId()).isPresent())
            throw new BadRequestException("You have already used a referral code");

        User referrer = userRepository.findByReferralCode(code.toUpperCase())
                .orElseThrow(() -> new BadRequestException("Invalid referral code"));

        if (referrer.getId().equals(userDetails.getId()))
            throw new BadRequestException("Cannot use your own referral code");

        User referee = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Referral referral = new Referral();
        referral.setReferrer(referrer);
        referral.setReferee(referee);
        referral.setRewardCredited(true);
        referralRepository.save(referral);

        // Credit Rs.50 to both
        walletService.credit(referrer.getId(), REWARD, "Referral reward - " + referee.getFullName() + " joined using your code");
        walletService.credit(referee.getId(), REWARD, "Welcome bonus - referral code applied");

        notificationHelper.push(referrer.getId(), "Referral Reward!",
                referee.getFullName() + " joined using your code. Rs.50 credited to your wallet!",
                NotificationType.OFFER, "/wallet", null);

        return ResponseEntity.ok(Map.of("message", "Referral applied! Rs.50 credited to your wallet"));
    }

    // List my referrals
    @GetMapping("/my-referrals")
    public ResponseEntity<List<Map<String, Object>>> myReferrals(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(
                referralRepository.findByReferrerId(userDetails.getId()).stream()
                        .map(r -> Map.<String, Object>of(
                                "name", r.getReferee().getFullName() != null ? r.getReferee().getFullName() : r.getReferee().getUsername(),
                                "joinedAt", r.getCreatedAt().toString(),
                                "rewarded", r.isRewardCredited()
                        )).toList()
        );
    }
}
