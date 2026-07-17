package com.foodhub.restaurant.service;

import com.foodhub.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class RestaurantScheduler {

    private final RestaurantRepository restaurantRepository;

    // Runs every minute — opens restaurants whose openTime has arrived
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    @CacheEvict(value = {"restaurant", "cities"}, allEntries = true)
    public void syncOpenClose() {
        LocalTime now = LocalTime.now();
        int opened = restaurantRepository.openByTime(now);
        int closed = restaurantRepository.closeByTime(now);
        if (opened > 0) log.info("Opened {} restaurant(s) at {}", opened, now);
        if (closed > 0) log.info("Closed {} restaurant(s) at {}", closed, now);
    }
}
