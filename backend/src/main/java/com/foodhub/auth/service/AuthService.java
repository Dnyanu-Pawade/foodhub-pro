package com.foodhub.auth.service;

import com.foodhub.auth.dto.AuthResponse;
import com.foodhub.auth.dto.LoginRequest;
import com.foodhub.auth.dto.RefreshTokenRequest;
import com.foodhub.auth.dto.RegisterRequest;
import com.foodhub.auth.entity.RefreshToken;
import com.foodhub.auth.entity.Role;
import com.foodhub.auth.entity.Role.ERole;
import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.RefreshTokenRepository;
import com.foodhub.auth.repository.RoleRepository;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.auth.security.JwtTokenProvider;
import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.TokenRefreshException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public AuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(auth);
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();

        String accessToken = jwtTokenProvider.generateAccessToken(auth);
        String refreshToken = createRefreshToken(userDetails.getId());

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).collect(Collectors.toList());

        return new AuthResponse(accessToken, refreshToken, userDetails.getId(),
                userDetails.getUsername(), userDetails.getEmail(),
                userDetails.getFullName(), userDetails.getPhone(), roles);
    }

    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new BadRequestException("Username already taken");
        if (userRepository.existsByEmail(request.getEmail()))
            throw new BadRequestException("Email already in use");
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone()))
            throw new BadRequestException("Phone already registered");

        User user = new User(request.getUsername(), request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(), request.getPhone());

        user.setRoles(Set.of(resolveRole(request.getRole())));
        userRepository.save(user);
        return "Registration successful! Please login.";
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new TokenRefreshException("Refresh token not found"));

        if (stored.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(stored);
            throw new TokenRefreshException("Refresh token expired. Please login again.");
        }

        // Rotate: delete old, issue new
        User user = stored.getUser();
        refreshTokenRepository.delete(stored);

        String newAccessToken = jwtTokenProvider.generateAccessTokenFromUsername(user.getUsername());
        String newRefreshToken = createRefreshToken(user.getId());

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name()).collect(Collectors.toList());

        return new AuthResponse(newAccessToken, newRefreshToken, user.getId(),
                user.getUsername(), user.getEmail(), user.getFullName(), user.getPhone(), roles);
    }

    @Transactional
    public void logout(Long userId) {
        userRepository.findById(userId).ifPresent(refreshTokenRepository::deleteByUser);
    }

    private String createRefreshToken(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        refreshTokenRepository.deleteByUser(user);
        RefreshToken token = new RefreshToken(user,
                jwtTokenProvider.generateRefreshTokenValue(),
                Instant.now().plusMillis(refreshTokenExpiration));
        return refreshTokenRepository.save(token).getToken();
    }

    public AuthResponse loginByUser(User user) {
        String accessToken  = jwtTokenProvider.generateAccessTokenFromUsername(user.getUsername());
        String refreshToken = createRefreshToken(user.getId());
        List<String> roles  = user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList());
        return new AuthResponse(accessToken, refreshToken, user.getId(),
                user.getUsername(), user.getEmail(), user.getFullName(), user.getPhone(), roles);
    }

    private Role resolveRole(String roleName) {
        ERole eRole = switch (roleName == null ? "" : roleName.toLowerCase()) {
            case "restaurant_owner" -> ERole.ROLE_RESTAURANT_OWNER;
            case "delivery_partner" -> ERole.ROLE_DELIVERY_PARTNER;
            case "admin"            -> ERole.ROLE_ADMIN;
            default                 -> ERole.ROLE_CUSTOMER;
        };
        return roleRepository.findByName(eRole)
                .orElseThrow(() -> new RuntimeException("Role not found: " + eRole));
    }
}
