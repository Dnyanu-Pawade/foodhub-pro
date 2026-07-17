package com.foodhub.notification.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationService {

    @Value("${twilio.account-sid}")  private String accountSid;
    @Value("${twilio.auth-token}")   private String authToken;
    @Value("${twilio.phone-number}") private String fromPhone;

    private boolean twilioReady = false;

    private void ensureTwilio() {
        if (twilioReady) return;
        if ("your_account_sid".equals(accountSid)) {
            log.warn("Twilio not configured — SMS disabled");
            return;
        }
        try {
            Twilio.init(accountSid, authToken);
            twilioReady = true;
            log.info("Twilio initialised");
        } catch (Exception e) {
            log.warn("Twilio init failed: {}", e.getMessage());
        }
    }

    public void sendSms(String toPhone, String body) {
        ensureTwilio();
        if (!twilioReady) {
            log.info("SMS skipped (not configured): {}", body);
            return;
        }
        try {
            Message.creator(new PhoneNumber(toPhone), new PhoneNumber(fromPhone), body).create();
            log.info("SMS sent to {}", toPhone);
        } catch (Exception e) {
            log.warn("SMS failed to {}: {}", toPhone, e.getMessage());
        }
    }

    public void sendOrderConfirmation(String phone, String customerName,
                                      Long orderId, String restaurantName) {
        if (phone == null) return;
        sendSms(phone, "Hi " + customerName + "! Your order #" + orderId
                + " from " + restaurantName + " is being prepared. 🍽️");
    }

    public void sendOrderDelivered(String phone, String customerName, Long orderId) {
        if (phone == null) return;
        sendSms(phone, "Hi " + customerName + "! Order #" + orderId + " delivered. Enjoy! ⭐");
    }

    public void sendOrderStatusUpdate(String phone, String customerName, Long orderId, String status) {
        if (phone == null) return;
        String emoji;
        String msg;
        switch (status) {
            case "CONFIRMED"        -> { emoji = "✅"; msg = "confirmed and being prepared"; }
            case "PREPARING"        -> { emoji = "👨\u200d🍳"; msg = "being prepared in the kitchen"; }
            case "READY_FOR_PICKUP" -> { emoji = "📦"; msg = "ready and waiting for pickup"; }
            case "PICKED_UP"        -> { emoji = "🛵"; msg = "picked up and on the way!"; }
            case "DELIVERED"        -> { emoji = "🎉"; msg = "delivered. Enjoy your meal!"; }
            case "CANCELLED"        -> { emoji = "❌"; msg = "cancelled."; }
            case "REJECTED"         -> { emoji = "⚠️"; msg = "rejected by the restaurant."; }
            default                 -> { emoji = "📋"; msg = "updated to " + status; }
        }
        sendWhatsApp(phone,
            emoji + " *FoodHub Pro* — Order Update\n\n" +
            "Hi " + customerName + "! Your order *#" + orderId + "* is now " + msg + "\n\n" +
            "Track: http://localhost:8082/orders/" + orderId);
    }

    // WhatsApp via Twilio (same API, different prefix)
    public void sendWhatsApp(String toPhone, String body) {
        ensureTwilio();
        if (!twilioReady) {
            log.info("WhatsApp skipped (not configured): {}", body);
            return;
        }
        try {
            // Twilio WhatsApp sandbox: prefix with 'whatsapp:'
            Message.creator(
                new PhoneNumber("whatsapp:" + toPhone),
                new PhoneNumber("whatsapp:" + fromPhone),
                body
            ).create();
            log.info("WhatsApp sent to {}", toPhone);
        } catch (Exception e) {
            log.warn("WhatsApp failed to {}: {}", toPhone, e.getMessage());
        }
    }

    public void sendOrderConfirmationWhatsApp(String phone, String customerName,
                                              Long orderId, String restaurantName, String total) {
        if (phone == null) return;
        sendWhatsApp(phone,
            "🍽️ *FoodHub Pro* — Order Confirmed!\n\n" +
            "Hi " + customerName + "! Your order *#" + orderId + "* from *" + restaurantName +
            "* (₹" + total + ") has been placed.\n\n" +
            "Track your order: http://localhost:8082/orders/" + orderId + "\n\n" +
            "Thank you for ordering! 🙏");
    }
}
