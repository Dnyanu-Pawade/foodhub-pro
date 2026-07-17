package com.foodhub.restaurant.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.restaurant.dto.RestaurantDto;
import com.foodhub.restaurant.entity.Favorite;
import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.repository.FavoriteRepository;
import com.foodhub.restaurant.repository.RestaurantRepository;
import com.foodhub.auth.repository.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorites")
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<RestaurantDto>> getFavorites(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(
            favoriteRepository.findByUserId(user.getId()).stream()
                .map(f -> toDto(f.getRestaurant()))
                .toList()
        );
    }

    @PostMapping("/{restaurantId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String, Object>> toggle(@PathVariable Long restaurantId,
                                                       @AuthenticationPrincipal UserDetailsImpl user) {
        boolean exists = favoriteRepository.existsByUserIdAndRestaurantId(user.getId(), restaurantId);
        if (exists) {
            favoriteRepository.deleteByUserIdAndRestaurantId(user.getId(), restaurantId);
            return ResponseEntity.ok(Map.of("favorited", false, "message", "Removed from favorites"));
        } else {
            Restaurant restaurant = restaurantRepository.findByIdAndDeletedAtIsNull(restaurantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
            Favorite fav = new Favorite();
            fav.setUser(userRepository.findById(user.getId()).orElseThrow());
            fav.setRestaurant(restaurant);
            favoriteRepository.save(fav);
            return ResponseEntity.ok(Map.of("favorited", true, "message", "Added to favorites"));
        }
    }

    @GetMapping("/{restaurantId}/check")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String, Boolean>> check(@PathVariable Long restaurantId,
                                                       @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(Map.of("favorited",
                favoriteRepository.existsByUserIdAndRestaurantId(user.getId(), restaurantId)));
    }

    private RestaurantDto toDto(Restaurant r) {
        RestaurantDto dto = new RestaurantDto();
        dto.setId(r.getId()); dto.setName(r.getName());
        dto.setCuisineType(r.getCuisineType()); dto.setCity(r.getCity());
        dto.setLogoUrl(r.getLogoUrl()); dto.setAvgRating(r.getAvgRating());
        dto.setAvgDeliveryTimeMinutes(r.getAvgDeliveryTimeMinutes());
        dto.setDeliveryFee(r.getDeliveryFee()); dto.setStoreType(r.getStoreType());
        dto.setStatus(r.getStatus()); dto.setAddress(r.getAddress());
        return dto;
    }
}
