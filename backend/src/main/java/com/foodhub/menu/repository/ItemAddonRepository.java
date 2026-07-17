package com.foodhub.menu.repository;

import com.foodhub.menu.entity.ItemAddon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemAddonRepository extends JpaRepository<ItemAddon, Long> {
    List<ItemAddon> findByMenuItemId(Long menuItemId);
    void deleteByMenuItemId(Long menuItemId);
}
