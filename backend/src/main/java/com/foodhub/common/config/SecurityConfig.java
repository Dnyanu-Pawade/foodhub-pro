package com.foodhub.common.config;

import com.foodhub.auth.security.JwtAuthEntryPoint;
import com.foodhub.auth.security.JwtAuthenticationFilter;
import com.foodhub.auth.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthEntryPoint))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Static frontend files
                .requestMatchers("/", "/index.html", "/assets/**", "/favicon.svg",
                                 "/manifest.json", "/sw.js", "/robots.txt").permitAll()
                // React Router
                .requestMatchers("/login", "/register", "/forgot-password", "/search", "/restaurant/**", "/cart",
                                 "/orders/**", "/wallet", "/favorites", "/profile",
                                 "/addresses", "/notifications", "/loyalty",
                                 "/owner/**", "/admin", "/admin/**",
                                 "/delivery/**", "/staff/**",
                                 "/finance", "/marketing", "/support", "/superadmin",
                                 "/invoice", "/scheduled-orders", "/gift-cards",
                                 "/order-success", "/table-booking", "/chat/**",
                                 "/explore", "/landing", "/referral", "/subscription",
                                 "/group-order", "/group-order/**",
                                 "/qr-order", "/order").permitAll()
                // Public API
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/restaurants/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu/*/addons").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/search/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/collections/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/coupons/active").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/recommendations/trending").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/recommendations/also-ordered/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/group-cart/**").permitAll()
                .requestMatchers("/api/group-cart/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/cities").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/surge/status").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/orders/guest").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/delivery/location/**").authenticated()
                .requestMatchers("/api/referral/**").authenticated()
                .requestMatchers("/api/subscription/**").authenticated()
                .requestMatchers("/api/gift-cards/**").authenticated()
                .requestMatchers("/api/scheduled-orders/**").authenticated()
                .requestMatchers("/api/ai/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/chat/**").authenticated()
                .requestMatchers("/api/table-bookings/**").authenticated()
                .requestMatchers("/api/kyc/my-status").hasRole("DELIVERY_PARTNER")
                .requestMatchers("/api/kyc/submit").hasRole("DELIVERY_PARTNER")
                .requestMatchers("/api/kyc/admin/**").hasRole("ADMIN")
                // Admin only
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Restaurant owner
                .requestMatchers("/api/owner/**").hasRole("RESTAURANT_OWNER")
                // Delivery partner
                .requestMatchers("/api/delivery/**").hasRole("DELIVERY_PARTNER")
                // Any authenticated user
                .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
