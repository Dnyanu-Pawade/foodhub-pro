package com.foodhub.review.service;

import com.foodhub.auth.repository.UserRepository;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.repository.RestaurantRepository;
import com.foodhub.review.dto.ReviewDto;
import com.foodhub.review.entity.Review;
import com.foodhub.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ReviewDto> getReviews(Long restaurantId) {
        return reviewRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public ReviewDto addReview(Long restaurantId, ReviewDto dto, Long customerId) {
        if (reviewRepository.findByCustomerIdAndRestaurantId(customerId, restaurantId).isPresent())
            throw new BadRequestException("You have already reviewed this restaurant");

        Restaurant restaurant = restaurantRepository.findByIdAndDeletedAtIsNull(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

        Review review = new Review();
        review.setCustomer(userRepository.findById(customerId).orElseThrow());
        review.setRestaurant(restaurant);
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        Review saved = reviewRepository.save(review);

        // Update restaurant avg rating
        Double avg = reviewRepository.avgRatingByRestaurant(restaurantId);
        long count = reviewRepository.countByRestaurantId(restaurantId);
        restaurant.setAvgRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        restaurant.setTotalRatings((int) count);
        restaurantRepository.save(restaurant);

        return toDto(saved);
    }

    public Map<String, Object> getStats(Long restaurantId) {
        List<Review> reviews = reviewRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        Map<Integer, Long> breakdown = new java.util.HashMap<>();
        for (int i = 1; i <= 5; i++) {
            final int star = i;
            breakdown.put(star, reviews.stream().filter(r -> r.getRating() == star).count());
        }
        return Map.of("avgRating", Math.round(avg * 10.0) / 10.0,
                      "totalReviews", reviews.size(),
                      "ratingBreakdown", breakdown);
    }

    @Transactional
    public ReviewDto replyToReview(Long reviewId, String reply) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        review.setOwnerReply(reply);
        return toDto(reviewRepository.save(review));
    }

    private ReviewDto toDto(Review r) {
        ReviewDto dto = new ReviewDto();
        dto.setId(r.getId());
        dto.setCustomerId(r.getCustomer().getId());
        dto.setCustomerName(r.getCustomer().getFullName());
        dto.setRestaurantId(r.getRestaurant().getId());
        dto.setRating(r.getRating());
        dto.setComment(r.getComment());
        dto.setOwnerReply(r.getOwnerReply());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
