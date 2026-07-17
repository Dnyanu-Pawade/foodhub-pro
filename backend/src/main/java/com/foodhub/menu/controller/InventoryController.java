package com.foodhub.menu.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.menu.entity.InventoryItem;
import com.foodhub.menu.repository.InventoryRepository;
import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.repository.RestaurantRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner/restaurants/{restaurantId}/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory")
public class InventoryController {

    private final InventoryRepository inventoryRepository;
    private final RestaurantRepository restaurantRepository;

    @GetMapping
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<List<InventoryItem>> getAll(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(inventoryRepository.findByRestaurantId(restaurantId));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<List<InventoryItem>> getLowStock(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(
            inventoryRepository.findByRestaurantId(restaurantId).stream()
                .filter(i -> i.getQuantity() <= i.getLowStockThreshold())
                .toList()
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<InventoryItem> create(@PathVariable Long restaurantId,
                                                 @RequestBody InventoryItem item,
                                                 @AuthenticationPrincipal UserDetailsImpl user) {
        Restaurant restaurant = restaurantRepository.findByIdAndDeletedAtIsNull(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        item.setRestaurant(restaurant);
        return ResponseEntity.ok(inventoryRepository.save(item));
    }

    @PatchMapping("/{itemId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<InventoryItem> updateQuantity(@PathVariable Long restaurantId,
                                                         @PathVariable Long itemId,
                                                         @RequestBody Map<String, Double> body) {
        InventoryItem item = inventoryRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        item.setQuantity(body.get("quantity"));
        return ResponseEntity.ok(inventoryRepository.save(item));
    }

    @DeleteMapping("/{itemId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long restaurantId, @PathVariable Long itemId) {
        inventoryRepository.deleteById(itemId);
        return ResponseEntity.noContent().build();
    }
}
