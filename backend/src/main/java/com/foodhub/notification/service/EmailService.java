package com.foodhub.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Value("${spring.mail.username:your_email@gmail.com}") private String fromEmail;

    // JavaMailSender is excluded from autoconfiguration — inject lazily via setter
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setMailSender(org.springframework.mail.javamail.JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOrderConfirmation(String toEmail, String customerName,
                                      Long orderId, String restaurantName, String total) {
        send(toEmail,
             "Order #" + orderId + " Confirmed — FoodHub Pro",
             "Hi " + customerName + ",\n\nYour order #" + orderId
             + " from " + restaurantName + " (₹" + total + ") has been placed!\n\nThank you 🍽️");
    }

    public void sendOrderDelivered(String toEmail, String customerName, Long orderId) {
        send(toEmail,
             "Order #" + orderId + " Delivered — FoodHub Pro",
             "Hi " + customerName + ",\n\nYour order #" + orderId
             + " has been delivered. Enjoy your meal! ⭐\n\nRate us on FoodHub Pro.");
    }

    public void sendOtp(String toEmail, String otp) {
        send(toEmail, "Your FoodHub Pro OTP",
             "Your one-time password is: " + otp + "\n\nValid for 5 minutes. Do not share.");
    }

    private void send(String to, String subject, String text) {
        if (mailSender == null || "your_email@gmail.com".equals(fromEmail)) {
            log.info("Email skipped (not configured) → {}: {}", to, subject);
            return;
        }
        try {
            org.springframework.mail.SimpleMailMessage msg = new org.springframework.mail.SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
            log.info("Email sent to {}", to);
        } catch (Exception e) {
            log.warn("Email failed to {}: {}", to, e.getMessage());
        }
    }
}
