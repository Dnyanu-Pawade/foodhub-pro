package com.foodhub.auth.controller;

import com.foodhub.auth.dto.AuthResponse;
import com.foodhub.auth.dto.LoginRequest;
import com.foodhub.auth.dto.RefreshTokenRequest;
import com.foodhub.auth.dto.RegisterRequest;
import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.auth.service.AuthService;
import com.foodhub.auth.service.OtpService;
import com.foodhub.common.dto.ApiResponse;
import com.foodhub.notification.service.EmailService;
import com.foodhub.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, Login, Refresh Token, Logout")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user (customer / restaurant_owner / delivery_partner)")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(new ApiResponse(true, authService.register(request)));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive access + refresh tokens")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Get new access token using refresh token")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate refresh token")
    public ResponseEntity<ApiResponse> logout(@AuthenticationPrincipal UserDetailsImpl user) {
        authService.logout(user.getId());
        return ResponseEntity.ok(new ApiResponse(true, "Logged out successfully"));
    }

    @PostMapping("/otp/send")
    @Operation(summary = "Send OTP to phone or email")
    public ResponseEntity<ApiResponse> sendOtp(@RequestBody Map<String, String> body) {
        String identifier = body.get("identifier");
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .or(() -> userRepository.findByPhone(identifier))
                .orElse(null);
        String otp = otpService.generateOtp(identifier);
        if (identifier.startsWith("+") || identifier.matches("\\d{10,}")) {
            String phone = identifier.startsWith("+") ? identifier : "+91" + identifier;
            notificationService.sendSms(phone, "Your FoodHub OTP: " + otp + " (valid 5 min)");
        } else if (user != null) {
            emailService.sendOtp(user.getEmail(), otp);
        }
        return ResponseEntity.ok(new ApiResponse(true, "OTP sent"));
    }

    @PostMapping("/otp/verify-only")
    @Operation(summary = "Verify OTP only (for registration)")
    public ResponseEntity<ApiResponse> verifyOtpOnly(@RequestBody Map<String, String> body) {
        String identifier = body.get("identifier");
        String otp        = body.get("otp");
        if (!otpService.verifyOtp(identifier, otp))
            throw new com.foodhub.common.exception.BadRequestException("Invalid or expired OTP");
        return ResponseEntity.ok(new ApiResponse(true, "OTP verified"));
    }

    @PostMapping("/otp/verify")
    @Operation(summary = "Verify OTP and login")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody Map<String, String> body) {
        String identifier = body.get("identifier");
        String otp        = body.get("otp");
        if (!otpService.verifyOtp(identifier, otp))
            throw new com.foodhub.common.exception.BadRequestException("Invalid or expired OTP");
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new com.foodhub.common.exception.ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(authService.loginByUser(user));
    }
}
