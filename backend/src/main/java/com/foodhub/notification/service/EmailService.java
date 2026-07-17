package com.foodhub.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Value("${spring.mail.username:your_email@gmail.com}") private String fromEmail;

    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setMailSender(org.springframework.mail.javamail.JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOrderConfirmation(String toEmail, String customerName,
                                      Long orderId, String restaurantName, String total) {
        String subject = "🍽️ Order #" + orderId + " Confirmed — FoodHub Pro";
        String html = baseTemplate(
            "Order Confirmed! 🎉",
            "Hi " + customerName + ",",
            "Your order <strong>#" + orderId + "</strong> from <strong>" + restaurantName +
            "</strong> has been placed successfully for <strong>₹" + total + "</strong>.",
            "We'll notify you as your order progresses. Sit back and relax! 😊",
            "#22c55e", "✅"
        );
        sendHtml(toEmail, subject, html);
    }

    public void sendOrderDelivered(String toEmail, String customerName, Long orderId) {
        String subject = "🎉 Order #" + orderId + " Delivered — FoodHub Pro";
        String html = baseTemplate(
            "Order Delivered! 🎉",
            "Hi " + customerName + ",",
            "Your order <strong>#" + orderId + "</strong> has been delivered. Enjoy your meal!",
            "Loved it? Leave a review on FoodHub Pro and earn loyalty points! ⭐",
            "#f97316", "🛵"
        );
        sendHtml(toEmail, subject, html);
    }

    public void sendOtp(String toEmail, String otp) {
        String subject = "🔐 Your FoodHub Pro OTP";
        String html = baseTemplate(
            "Your One-Time Password",
            "Hello,",
            "Your OTP is: <span style='font-size:36px;font-weight:900;letter-spacing:8px;color:#f97316'>" + otp + "</span>",
            "Valid for 5 minutes. Do not share this with anyone.",
            "#6366f1", "🔐"
        );
        sendHtml(toEmail, subject, html);
    }

    private String baseTemplate(String heading, String greeting, String body, String footer, String color, String emoji) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'/></head><body style='margin:0;padding:0;background:#f9fafb;font-family:Inter,Arial,sans-serif'>" +
            "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding:40px 16px'>" +
            "<table width='560' cellpadding='0' cellspacing='0' style='background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)'>" +
            "<tr><td style='background:" + color + ";padding:32px;text-align:center'>" +
            "<div style='font-size:48px'>" + emoji + "</div>" +
            "<h1 style='color:white;margin:12px 0 0;font-size:22px;font-weight:800'>" + heading + "</h1>" +
            "</td></tr>" +
            "<tr><td style='padding:32px'>" +
            "<p style='font-size:16px;color:#374151;margin:0 0 16px'>" + greeting + "</p>" +
            "<p style='font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 16px'>" + body + "</p>" +
            "<p style='font-size:14px;color:#9ca3af;margin:0'>" + footer + "</p>" +
            "</td></tr>" +
            "<tr><td style='background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6'>" +
            "<p style='font-size:13px;color:#9ca3af;margin:0'>FoodHub Pro &mdash; Delivering happiness 🍽️</p>" +
            "</td></tr>" +
            "</table></td></tr></table></body></html>";
    }

    private void sendHtml(String to, String subject, String html) {
        if (mailSender == null || "your_email@gmail.com".equals(fromEmail)) {
            log.info("Email skipped (not configured) → {}: {}", to, subject);
            return;
        }
        try {
            jakarta.mail.internet.MimeMessage msg = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper =
                new org.springframework.mail.javamail.MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromEmail, "FoodHub Pro");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
            log.info("HTML email sent to {}", to);
        } catch (Exception e) {
            log.warn("Email failed to {}: {}", to, e.getMessage());
        }
    }
}
