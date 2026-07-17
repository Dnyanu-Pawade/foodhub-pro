package com.foodhub.notification.service;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.notification.entity.Notification.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PushNotificationScheduler {

    private final UserRepository userRepository;
    private final NotificationHelper notificationHelper;

    // Lunch reminder — 12:00 PM every day
    @Scheduled(cron = "0 0 12 * * *")
    public void lunchReminder() {
        sendToAllCustomers(
            "🍽️ Hungry? It's lunch time!",
            "Order now and get delivery in 30 mins. Use FREEDEL for free delivery!",
            "/"
        );
        log.info("Lunch reminder sent");
    }

    // Dinner reminder — 7:00 PM every day
    @Scheduled(cron = "0 0 19 * * *")
    public void dinnerReminder() {
        sendToAllCustomers(
            "🌙 Dinner time! What are you craving?",
            "Browse 500+ restaurants. Order now, delivered hot to your door!",
            "/"
        );
        log.info("Dinner reminder sent");
    }

    // Weekend special — Saturday 11:00 AM
    @Scheduled(cron = "0 0 11 * * SAT")
    public void weekendSpecial() {
        sendToAllCustomers(
            "🎉 Weekend Special Offers!",
            "Extra 20% off on weekend orders. Limited time — order now!",
            "/"
        );
        log.info("Weekend special sent");
    }

    private void sendToAllCustomers(String title, String message, String link) {
        try {
            List<User> customers = userRepository.findByRoleName("ROLE_CUSTOMER");
            customers.forEach(u -> {
                try {
                    notificationHelper.push(u.getId(), title, message, NotificationType.OFFER, link, null);
                } catch (Exception ignored) {}
            });
        } catch (Exception e) {
            log.warn("Scheduler error: {}", e.getMessage());
        }
    }
}
