package com.foodhub.restaurant.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.dto.ApiResponse;
import com.foodhub.restaurant.dto.RestaurantDto;
import com.foodhub.restaurant.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    // ── Public ──────────────────────────────────────────────────────────────

    @GetMapping("/api/cities")
    @Operation(summary = "Get all available cities")
    public ResponseEntity<List<String>> getCities() {
        return ResponseEntity.ok(restaurantService.getCities());
    }

    @GetMapping("/api/restaurants")
    @Operation(summary = "Search restaurants (public)")
    public ResponseEntity<Page<RestaurantDto>> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String storeType,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean vegOnly,
            @RequestParam(required = false) Double maxDeliveryFee,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Boolean openNow,
            @RequestParam(required = false, defaultValue = "relevance") String sortBy,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(restaurantService.search(
                city, storeType, search, vegOnly, maxDeliveryFee, minRating, openNow, sortBy, pageable));
    }

    @GetMapping("/api/restaurants/{id}")
    @Operation(summary = "Get restaurant by ID (public)")
    public ResponseEntity<RestaurantDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.getById(id));
    }

    // ── Owner ────────────────────────────────────────────────────────────────

    @GetMapping("/api/owner/restaurants")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    @Operation(summary = "Get my restaurants")
    public ResponseEntity<List<RestaurantDto>> getMyRestaurants(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(restaurantService.getMyRestaurants(user.getId()));
    }

    @PostMapping("/api/owner/restaurants")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    @Operation(summary = "Register a new restaurant")
    public ResponseEntity<RestaurantDto> create(@Valid @RequestBody RestaurantDto dto,
                                                @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(restaurantService.create(dto, user.getId()));
    }

    @PutMapping("/api/owner/restaurants/{id}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    @Operation(summary = "Update restaurant")
    public ResponseEntity<RestaurantDto> update(@PathVariable Long id,
                                                @Valid @RequestBody RestaurantDto dto,
                                                @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(restaurantService.update(id, dto, user.getId()));
    }

    @PatchMapping("/api/owner/restaurants/{id}/toggle-open")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<RestaurantDto> toggleOpen(@PathVariable Long id,
                                                    @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(restaurantService.toggleOpen(id, user.getId()));
    }

    @DeleteMapping("/api/owner/restaurants/{id}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    @Operation(summary = "Delete restaurant (soft delete)")
    public ResponseEntity<ApiResponse> delete(@PathVariable Long id,
                                              @AuthenticationPrincipal UserDetailsImpl user) {
        restaurantService.delete(id, user.getId());
        return ResponseEntity.ok(new ApiResponse(true, "Restaurant deleted"));
    }

    @PostMapping("/api/owner/restaurants/{id}/photos")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<RestaurantDto> addPhoto(@PathVariable Long id,
                                                  @RequestParam String photoUrl,
                                                  @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(restaurantService.addPhoto(id, photoUrl, user.getId()));
    }

    @DeleteMapping("/api/owner/restaurants/{id}/photos")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<RestaurantDto> removePhoto(@PathVariable Long id,
                                                     @RequestParam String photoUrl,
                                                     @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(restaurantService.removePhoto(id, photoUrl, user.getId()));
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    @PatchMapping("/api/admin/restaurants/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve restaurant")
    public ResponseEntity<RestaurantDto> approve(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.approve(id));
    }

    @PatchMapping("/api/admin/restaurants/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject restaurant")
    public ResponseEntity<RestaurantDto> reject(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.reject(id));
    }

    @PatchMapping("/api/admin/restaurants/{id}/promote")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Promote restaurant for N days")
    public ResponseEntity<RestaurantDto> promote(@PathVariable Long id, @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(restaurantService.promote(id, days));
    }
}
