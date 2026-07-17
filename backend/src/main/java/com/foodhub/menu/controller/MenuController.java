package com.foodhub.menu.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.dto.ApiResponse;
import com.foodhub.menu.dto.ItemAddonDto;
import com.foodhub.menu.dto.MenuItemDto;
import com.foodhub.menu.repository.MenuItemRepository;
import com.foodhub.menu.service.MenuService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Menu")
public class MenuController {

    private final MenuService menuService;
    private final MenuItemRepository menuItemRepository;

    @GetMapping("/api/search/dishes")
    public ResponseEntity<List<MenuItemDto>> searchDishes(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(
            menuItemRepository.searchDishes(q.trim()).stream()
                .map(menuService::toDto).toList());
    }

    @GetMapping("/api/search/autocomplete")
    public ResponseEntity<List<String>> autocomplete(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(menuItemRepository.autocomplete(q.trim()));
    }

    @GetMapping("/api/restaurants/{restaurantId}/menu")
    public ResponseEntity<List<MenuItemDto>> getMenu(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(menuService.getMenu(restaurantId));
    }

    @PostMapping("/api/owner/restaurants/{restaurantId}/menu")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<MenuItemDto> addItem(@PathVariable Long restaurantId,
                                               @Valid @RequestBody MenuItemDto dto,
                                               @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(menuService.addItem(restaurantId, dto, user.getId()));
    }

    @PutMapping("/api/owner/menu/{itemId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<MenuItemDto> updateItem(@PathVariable Long itemId,
                                                  @Valid @RequestBody MenuItemDto dto,
                                                  @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(menuService.updateItem(itemId, dto, user.getId()));
    }

    @DeleteMapping("/api/owner/menu/{itemId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<ApiResponse> deleteItem(@PathVariable Long itemId,
                                                  @AuthenticationPrincipal UserDetailsImpl user) {
        menuService.deleteItem(itemId, user.getId());
        return ResponseEntity.ok(new ApiResponse(true, "Item deleted"));
    }

    @PatchMapping("/api/owner/menu/{itemId}/toggle-availability")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<MenuItemDto> toggleAvailability(@PathVariable Long itemId,
                                                          @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(menuService.toggleAvailability(itemId, user.getId()));
    }

    // ── Addons ──────────────────────────────────────────────────────────────

    @GetMapping("/api/menu/{itemId}/addons")
    public ResponseEntity<List<ItemAddonDto>> getAddons(@PathVariable Long itemId) {
        return ResponseEntity.ok(menuService.getAddons(itemId));
    }

    @PostMapping("/api/owner/menu/{itemId}/addons")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<ItemAddonDto> saveAddon(@PathVariable Long itemId,
                                                   @RequestBody ItemAddonDto dto,
                                                   @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(menuService.saveAddon(itemId, dto, user.getId()));
    }

    @DeleteMapping("/api/owner/menu/addons/{addonId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<ApiResponse> deleteAddon(@PathVariable Long addonId,
                                                    @AuthenticationPrincipal UserDetailsImpl user) {
        menuService.deleteAddon(addonId, user.getId());
        return ResponseEntity.ok(new ApiResponse(true, "Addon deleted"));
    }
}
