package com.foodhub.menu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

import java.math.BigDecimal;
import java.util.List;

@Data
public class MenuItemDto {
    private Long id;
    private Long restaurantId;
    private RestaurantInfo restaurant;
    private List<ItemAddonDto> addons;

    @Data
    public static class RestaurantInfo {
        private Long id;
        private String name;
    }

    @NotBlank private String name;
    private String description;
    @NotNull @DecimalMin("0.0") private BigDecimal price;
    private String category;
    private String imageUrl;

    @JsonProperty("isVeg")
    private boolean isVeg;

    @JsonProperty("isAvailable")
    private boolean isAvailable;
}
