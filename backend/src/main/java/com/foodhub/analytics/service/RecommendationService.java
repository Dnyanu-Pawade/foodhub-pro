package com.foodhub.analytics.service;

import com.foodhub.order.entity.Order;
import com.foodhub.order.entity.Order.OrderStatus;
import com.foodhub.order.repository.OrderRepository;
import com.foodhub.restaurant.dto.RestaurantDto;
import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;

    /**
     * Collaborative filtering:
     * 1. Find restaurants the customer has ordered from
     * 2. Find other customers who ordered from same restaurants
     * 3. Recommend restaurants those customers also ordered from (that current user hasn't tried)
     * 4. Fall back to top-rated restaurants if not enough data
     */
    public List<RestaurantDto> getRecommendations(Long customerId, int limit) {
        // Step 1: restaurants this customer ordered from
        List<Order> myOrders = orderRepository.findAll().stream()
                .filter(o -> o.getCustomer().getId().equals(customerId)
                          && o.getStatus() == OrderStatus.DELIVERED)
                .toList();

        Set<Long> myRestaurantIds = myOrders.stream()
                .map(o -> o.getRestaurant().getId())
                .collect(Collectors.toSet());

        List<RestaurantDto> recommendations = new ArrayList<>();

        if (!myRestaurantIds.isEmpty()) {
            // Step 2: find similar customers
            Set<Long> similarCustomers = orderRepository.findAll().stream()
                    .filter(o -> !o.getCustomer().getId().equals(customerId)
                              && myRestaurantIds.contains(o.getRestaurant().getId()))
                    .map(o -> o.getCustomer().getId())
                    .collect(Collectors.toSet());

            // Step 3: restaurants similar customers ordered from (that I haven't tried)
            Map<Long, Long> restaurantScore = orderRepository.findAll().stream()
                    .filter(o -> similarCustomers.contains(o.getCustomer().getId())
                              && !myRestaurantIds.contains(o.getRestaurant().getId()))
                    .collect(Collectors.groupingBy(o -> o.getRestaurant().getId(), Collectors.counting()));

            List<Long> recommendedIds = restaurantScore.entrySet().stream()
                    .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                    .limit(limit)
                    .map(Map.Entry::getKey)
                    .toList();

            recommendations = restaurantRepository.findAllById(recommendedIds).stream()
                    .filter(r -> r.getStatus() == Restaurant.RestaurantStatus.APPROVED && r.getDeletedAt() == null)
                    .map(this::toDto).toList();
        }

        // Step 4: fallback to top-rated if not enough
        if (recommendations.size() < limit) {
            Set<Long> alreadyIn = recommendations.stream().map(RestaurantDto::getId).collect(Collectors.toSet());
            alreadyIn.addAll(myRestaurantIds);

            List<RestaurantDto> topRated = restaurantRepository.findAll().stream()
                    .filter(r -> r.getStatus() == Restaurant.RestaurantStatus.APPROVED
                              && r.getDeletedAt() == null
                              && !alreadyIn.contains(r.getId()))
                    .sorted(Comparator.comparingDouble(Restaurant::getAvgRating).reversed())
                    .limit(limit - recommendations.size())
                    .map(this::toDto).toList();

            recommendations = new ArrayList<>(recommendations);
            recommendations.addAll(topRated);
        }

        return recommendations;
    }

    private RestaurantDto toDto(Restaurant r) {
        RestaurantDto dto = new RestaurantDto();
        dto.setId(r.getId()); dto.setName(r.getName());
        dto.setCuisineType(r.getCuisineType()); dto.setCity(r.getCity());
        dto.setLogoUrl(r.getLogoUrl()); dto.setAvgRating(r.getAvgRating());
        dto.setAvgDeliveryTimeMinutes(r.getAvgDeliveryTimeMinutes());
        dto.setDeliveryFee(r.getDeliveryFee()); dto.setStoreType(r.getStoreType());
        dto.setStatus(r.getStatus()); dto.setAddress(r.getAddress());
        return dto;
    }
}
