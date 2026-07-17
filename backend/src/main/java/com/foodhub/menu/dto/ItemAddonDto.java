package com.foodhub.menu.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ItemAddonDto {
    private Long id;
    private String groupName;
    private String name;
    private BigDecimal extraPrice;
    private boolean isDefault;
}
