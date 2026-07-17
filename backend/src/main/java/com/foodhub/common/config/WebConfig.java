package com.foodhub.common.config;

import com.foodhub.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.time.LocalTime;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class WebConfig implements WebMvcConfigurer {

    private final RestaurantRepository restaurantRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve locally uploaded files at /uploads/**
        File dir = new File(uploadDir).getAbsoluteFile();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + dir.getAbsolutePath() + "/");
    }

    // Every minute: auto open/close restaurants based on schedule
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void syncOpenCloseStatus() {
        LocalTime now = LocalTime.now();
        // Use a native query approach to avoid lazy-loading issues
        restaurantRepository.findAll().forEach(r -> {
            try {
                if (r.getOpenTime() == null || r.getCloseTime() == null) return;
                boolean shouldBeOpen;
                LocalTime open  = r.getOpenTime();
                LocalTime close = r.getCloseTime();
                // Handle overnight schedules (e.g. 22:00 - 02:00)
                if (close.isBefore(open)) {
                    shouldBeOpen = now.isAfter(open) || now.isBefore(close);
                } else {
                    shouldBeOpen = now.isAfter(open) && now.isBefore(close);
                }
                if (r.isOpen() != shouldBeOpen) {
                    r.setOpen(shouldBeOpen);
                    restaurantRepository.save(r);
                    log.info("Auto {} restaurant: {}", shouldBeOpen ? "opened" : "closed", r.getName());
                }
            } catch (Exception e) {
                log.warn("Skipping auto open/close for restaurant {}: {}", r.getId(), e.getMessage());
            }
        });
    }
}
