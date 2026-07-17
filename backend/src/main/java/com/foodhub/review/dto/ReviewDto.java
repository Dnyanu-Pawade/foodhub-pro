package com.foodhub.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewDto {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long restaurantId;
    @NotNull @Min(1) @Max(5) private Integer rating;
    private String comment;
    private String photoUrl;
    private String ownerReply;
    private LocalDateTime createdAt;
}
