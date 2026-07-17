package com.foodhub.menu.service;

import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.menu.dto.ItemAddonDto;
import com.foodhub.menu.dto.MenuItemDto;
import com.foodhub.menu.entity.ItemAddon;
import com.foodhub.menu.entity.MenuItem;
import com.foodhub.menu.repository.ItemAddonRepository;
import com.foodhub.menu.repository.MenuItemRepository;
import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final ItemAddonRepository itemAddonRepository;

    @Cacheable(value = "menu", key = "#restaurantId")
    @Transactional(readOnly = true)
    public List<MenuItemDto> getMenu(Long restaurantId) {
        return menuItemRepository
                .findByRestaurantIdAndIsAvailableTrueAndDeletedAtIsNull(restaurantId)
                .stream().map(this::toDto).toList();
    }

    @CacheEvict(value = "menu", key = "#restaurantId")
    @Transactional
    public MenuItemDto addItem(Long restaurantId, MenuItemDto dto, Long ownerId) {
        Restaurant restaurant = getOwnedRestaurant(restaurantId, ownerId);
        MenuItem item = new MenuItem();
        item.setRestaurant(restaurant);
        mapFields(item, dto);
        return toDto(menuItemRepository.save(item));
    }

    @Transactional
    public MenuItemDto updateItem(Long itemId, MenuItemDto dto, Long ownerId) {
        MenuItem item = menuItemRepository.findByIdAndDeletedAtIsNull(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        if (!item.getRestaurant().getOwner().getId().equals(ownerId))
            throw new BadRequestException("You don't own this menu item");
        mapFields(item, dto);
        return toDto(menuItemRepository.save(item));
    }

    @Transactional
    public void deleteItem(Long itemId, Long ownerId) {
        MenuItem item = menuItemRepository.findByIdAndDeletedAtIsNull(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        if (!item.getRestaurant().getOwner().getId().equals(ownerId))
            throw new BadRequestException("You don't own this menu item");
        item.setDeletedAt(LocalDateTime.now());
        menuItemRepository.save(item);
    }

    @Transactional
    public MenuItemDto toggleAvailability(Long itemId, Long ownerId) {
        MenuItem item = menuItemRepository.findByIdAndDeletedAtIsNull(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        if (!item.getRestaurant().getOwner().getId().equals(ownerId))
            throw new BadRequestException("You don't own this menu item");
        item.setAvailable(!item.isAvailable());
        return toDto(menuItemRepository.save(item));
    }

    // ── Addon CRUD ──────────────────────────────────────────────────────────

    public List<ItemAddonDto> getAddons(Long itemId) {
        return itemAddonRepository.findByMenuItemId(itemId).stream().map(this::addonToDto).toList();
    }

    @Transactional
    public ItemAddonDto saveAddon(Long itemId, ItemAddonDto dto, Long ownerId) {
        MenuItem item = menuItemRepository.findByIdAndDeletedAtIsNull(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        if (!item.getRestaurant().getOwner().getId().equals(ownerId))
            throw new BadRequestException("You don't own this menu item");
        ItemAddon addon = dto.getId() != null
                ? itemAddonRepository.findById(dto.getId()).orElse(new ItemAddon())
                : new ItemAddon();
        addon.setMenuItem(item);
        addon.setGroupName(dto.getGroupName());
        addon.setName(dto.getName());
        addon.setExtraPrice(dto.getExtraPrice());
        addon.setDefault(dto.isDefault());
        return addonToDto(itemAddonRepository.save(addon));
    }

    @Transactional
    public void deleteAddon(Long addonId, Long ownerId) {
        ItemAddon addon = itemAddonRepository.findById(addonId)
                .orElseThrow(() -> new ResourceNotFoundException("Addon not found"));
        if (!addon.getMenuItem().getRestaurant().getOwner().getId().equals(ownerId))
            throw new BadRequestException("Not authorized");
        itemAddonRepository.delete(addon);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private Restaurant getOwnedRestaurant(Long restaurantId, Long ownerId) {
        Restaurant r = restaurantRepository.findByIdAndDeletedAtIsNull(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        if (!r.getOwner().getId().equals(ownerId))
            throw new BadRequestException("You don't own this restaurant");
        return r;
    }

    private void mapFields(MenuItem item, MenuItemDto dto) {
        item.setName(dto.getName());
        item.setDescription(dto.getDescription());
        item.setPrice(dto.getPrice());
        item.setCategory(dto.getCategory());
        item.setImageUrl(dto.getImageUrl());
        item.setVeg(dto.isVeg());
        item.setAvailable(dto.isAvailable());
    }

    public MenuItemDto toDto(MenuItem item) {
        MenuItemDto dto = new MenuItemDto();
        dto.setId(item.getId());
        dto.setRestaurantId(item.getRestaurant().getId());
        MenuItemDto.RestaurantInfo ri = new MenuItemDto.RestaurantInfo();
        ri.setId(item.getRestaurant().getId());
        ri.setName(item.getRestaurant().getName());
        dto.setRestaurant(ri);
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setPrice(item.getPrice());
        dto.setCategory(item.getCategory());
        dto.setImageUrl(item.getImageUrl());
        dto.setVeg(item.isVeg());
        dto.setAvailable(item.isAvailable());
        dto.setAddons(itemAddonRepository.findByMenuItemId(item.getId()).stream().map(this::addonToDto).toList());
        return dto;
    }

    private ItemAddonDto addonToDto(ItemAddon a) {
        ItemAddonDto dto = new ItemAddonDto();
        dto.setId(a.getId());
        dto.setGroupName(a.getGroupName());
        dto.setName(a.getName());
        dto.setExtraPrice(a.getExtraPrice());
        dto.setDefault(a.isDefault());
        return dto;
    }
}
