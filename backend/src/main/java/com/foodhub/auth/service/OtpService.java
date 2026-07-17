package com.foodhub.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    private record OtpEntry(String otp, Instant expiry) {}

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public String generateOtp(String key) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        store.put(key, new OtpEntry(otp, Instant.now().plusSeconds(300)));
        log.info("OTP for {}: {}", key, otp); // visible in logs for dev/demo
        return otp;
    }

    public boolean verifyOtp(String key, String otp) {
        OtpEntry entry = store.get(key);
        if (entry == null || Instant.now().isAfter(entry.expiry())) {
            store.remove(key);
            return false;
        }
        if (entry.otp().equals(otp)) {
            store.remove(key);
            return true;
        }
        return false;
    }
}
