package com.foodhub.auth.controller;

import com.foodhub.auth.dto.AuthResponse;
import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.auth.service.AuthService;
import com.foodhub.common.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile")
public class UserProfileController {

    private final UserRepository userRepository;
    private final AuthService authService;

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (body.containsKey("fullName"))        user.setFullName(body.get("fullName"));
        if (body.containsKey("phone"))           user.setPhone(body.get("phone"));
        if (body.containsKey("profileImageUrl")) user.setProfileImageUrl(body.get("profileImageUrl"));
        userRepository.save(user);
        return ResponseEntity.ok(authService.loginByUser(user));
    }
}
