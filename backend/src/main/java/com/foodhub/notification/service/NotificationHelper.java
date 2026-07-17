package com.foodhub.notification.service;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.notification.entity.Notification;
import com.foodhub.notification.entity.Notification.NotificationType;
import com.foodhub.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationHelper {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void push(Long userId, String title, String message,
                     NotificationType type, String actionUrl, Long referenceId) {
        userRepository.findById(userId).ifPresent(user -> {
            Notification n = new Notification();
            n.setUser(user);
            n.setTitle(title);
            n.setMessage(message);
            n.setType(type);
            n.setActionUrl(actionUrl);
            n.setReferenceId(referenceId);
            notificationRepository.save(n);
            // Push via WebSocket so bell updates in real-time
            messagingTemplate.convertAndSendToUser(
                user.getUsername(), "/queue/notifications",
                Map.of("title", title, "message", message, "type", type.name())
            );
        });
    }

    public void orderUpdate(Long userId, Long orderId, String status) {
        push(userId,
             "Order #" + orderId + " Update",
             "Your order status changed to: " + status.replace("_", " "),
             NotificationType.ORDER_UPDATE,
             "/orders/" + orderId, orderId);
    }

    public void newOrder(Long ownerId, Long orderId, String customerName) {
        push(ownerId,
             "New Order #" + orderId,
             customerName + " placed a new order!",
             NotificationType.ORDER_UPDATE,
             "/owner/dashboard", orderId);
    }

    public void offerNotification(Long userId, String offerTitle, String details) {
        push(userId, offerTitle, details, NotificationType.OFFER, "/", null);
    }
}
