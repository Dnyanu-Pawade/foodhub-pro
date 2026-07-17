package com.foodhub.review.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.review.dto.ReviewDto;
import com.foodhub.review.service.ReviewService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/api/restaurants/{restaurantId}/reviews")
    public ResponseEntity<List<ReviewDto>> getReviews(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reviewService.getReviews(restaurantId));
    }

    @PostMapping("/api/restaurants/{restaurantId}/reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewDto> addReview(@PathVariable Long restaurantId,
                                               @Valid @RequestBody ReviewDto dto,
                                               @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(reviewService.addReview(restaurantId, dto, user.getId()));
    }

    // Also support /api/reviews/restaurant/{id} used by owner pages
    @GetMapping("/api/reviews/restaurant/{restaurantId}")
    public ResponseEntity<List<ReviewDto>> getReviewsAlt(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reviewService.getReviews(restaurantId));
    }

    @GetMapping("/api/reviews/restaurant/{restaurantId}/stats")
    public ResponseEntity<?> getStats(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reviewService.getStats(restaurantId));
    }

    @Data
    static class ReplyRequest { private String reply; }

    @PostMapping("/api/reviews/{reviewId}/reply")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<ReviewDto> reply(@PathVariable Long reviewId,
                                           @RequestBody ReplyRequest req) {
        return ResponseEntity.ok(reviewService.replyToReview(reviewId, req.getReply()));
    }
}
