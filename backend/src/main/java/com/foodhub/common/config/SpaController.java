package com.foodhub.common.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = {
        "/", "/login", "/register", "/search", "/cart", "/wallet",
        "/favorites", "/profile", "/addresses", "/notifications", "/loyalty", "/referral", "/subscription",
        "/orders", "/orders/**", "/restaurant/**",
        "/owner/**", "/delivery/**",
        "/admin", "/admin/**",
        "/staff/**", "/finance", "/marketing", "/support", "/superadmin",
        "/invoice", "/scheduled-orders", "/gift-cards",
        "/terms", "/privacy", "/landing",
        "/qr-order", "/order",
        "/owner/onboarding"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
