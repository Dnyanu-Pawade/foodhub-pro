package com.foodhub.analytics.controller;

import com.foodhub.analytics.service.RecommendationService;
import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.menu.dto.MenuItemDto;
import com.foodhub.menu.repository.MenuItemRepository;
import com.foodhub.menu.service.MenuService;
import com.foodhub.order.repository.OrderRepository;
import com.foodhub.restaurant.dto.RestaurantDto;
import com.foodhub.restaurant.repository.RestaurantRepository;
import com.foodhub.restaurant.entity.Restaurant;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final MenuService menuService;

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<RestaurantDto>> getRecommendations(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(recommendationService.getRecommendations(user.getId(), limit));
    }

    // Trending restaurants — most orders in last 24h
    @GetMapping("/trending")
    public ResponseEntity<List<RestaurantDto>> getTrending(
            @RequestParam(defaultValue = "8") int limit) {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<Object[]> rows = orderRepository.findTrendingRestaurantIds(since, PageRequest.of(0, limit));
        List<Long> ids = rows.stream().map(r -> (Long) r[0]).toList();
        List<RestaurantDto> result = restaurantRepository.findAllById(ids).stream()
                .filter(r -> r.getStatus() == Restaurant.RestaurantStatus.APPROVED && r.getDeletedAt() == null)
                .map(r -> {
                    RestaurantDto dto = toDto(r);
                    // attach order count
                    rows.stream().filter(row -> row[0].equals(r.getId())).findFirst()
                        .ifPresent(row -> dto.setRecentOrderCount(((Long) row[1]).intValue()));
                    return dto;
                }).toList();
        return ResponseEntity.ok(result);
    }

    // People also ordered — top items from same restaurant in last 7 days
    @GetMapping("/also-ordered/{restaurantId}")
    public ResponseEntity<List<MenuItemDto>> getPeopleAlsoOrdered(@PathVariable Long restaurantId,
                                                                    @RequestParam(defaultValue = "6") int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        List<Long> itemIds = orderRepository.findTopMenuItemIds(restaurantId, since, PageRequest.of(0, limit));
        List<MenuItemDto> items = menuItemRepository.findAllById(itemIds).stream()
                .filter(i -> i.isAvailable() && i.getDeletedAt() == null)
                .map(menuService::toDto).toList();
        return ResponseEntity.ok(items);
    }

    private RestaurantDto toDto(Restaurant r) {
        RestaurantDto dto = new RestaurantDto();
        dto.setId(r.getId()); dto.setName(r.getName());
        dto.setCuisineType(r.getCuisineType()); dto.setCity(r.getCity());
        dto.setLogoUrl(r.getLogoUrl()); dto.setBannerUrl(r.getBannerUrl());
        dto.setAvgRating(r.getAvgRating()); dto.setTotalRatings(r.getTotalRatings());
        dto.setAvgDeliveryTimeMinutes(r.getAvgDeliveryTimeMinutes());
        dto.setDeliveryFee(r.getDeliveryFee()); dto.setStoreType(r.getStoreType());
        dto.setStatus(r.getStatus()); dto.setAddress(r.getAddress());
        dto.setOpen(r.isOpen()); dto.setPromoted(r.isPromoted());
        dto.setOpenTime(r.getOpenTime()); dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
