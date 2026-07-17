package com.foodhub.auth.service;

import com.foodhub.auth.dto.RegisterRequest;
import com.foodhub.auth.entity.Role;
import com.foodhub.auth.entity.Role.ERole;
import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.RefreshTokenRepository;
import com.foodhub.auth.repository.RoleRepository;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.auth.security.JwtTokenProvider;
import com.foodhub.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock AuthenticationManager authenticationManager;
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider jwtTokenProvider;
    @InjectMocks AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshTokenExpiration", 604800000L);
    }

    @Test
    void register_success() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("testuser"); req.setEmail("test@test.com");
        req.setPassword("pass123"); req.setFullName("Test User");
        req.setPhone("9999999999"); req.setRole("customer");

        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@test.com")).thenReturn(false);
        when(userRepository.existsByPhone("9999999999")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(roleRepository.findByName(ERole.ROLE_CUSTOMER)).thenReturn(Optional.of(new Role(ERole.ROLE_CUSTOMER)));
        when(userRepository.save(any())).thenReturn(new User());

        String result = authService.register(req);
        assertThat(result).contains("successful");
    }

    @Test
    void register_duplicateUsername_throws() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("admin");
        when(userRepository.existsByUsername("admin")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Username already taken");
    }

    @Test
    void register_duplicateEmail_throws() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("newuser"); req.setEmail("existing@test.com");
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email already in use");
    }
}
