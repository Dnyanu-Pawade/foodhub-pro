package com.foodhub.restaurant.service;

import com.foodhub.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class RestaurantScheduler {

    private final RestaurantRepository restaurantRepository;

    // Open all approved restaurants at exactly 9:00 AM every day
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void openRestaurants() {
        int count = restaurantRepository.setAllOpen(true);
        log.info("Opened {} restaurant(s) at 9:00 AM", count);
    }

    // Close all approved restaurants at exactly 11:00 PM every day
    @Scheduled(cron = "0 0 23 * * *")
    @Transactional
    public void closeRestaurants() {
        int count = restaurantRepository.setAllOpen(false);
        log.info("Closed {} restaurant(s) at 11:00 PM", count);
    }
}
