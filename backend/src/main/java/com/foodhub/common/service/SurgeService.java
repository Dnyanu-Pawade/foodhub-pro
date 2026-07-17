package com.foodhub.common.service;

import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class SurgeService {

    private final AtomicBoolean adminSurgeEnabled = new AtomicBoolean(false);
    private static final double SURGE_MULTIPLIER = 1.5;

    private boolean isPeakHour() {
        LocalTime now = LocalTime.now();
        return (now.isAfter(LocalTime.of(12, 0)) && now.isBefore(LocalTime.of(14, 0)))
            || (now.isAfter(LocalTime.of(19, 0)) && now.isBefore(LocalTime.of(21, 0)));
    }

    public boolean isSurgeActive() {
        return adminSurgeEnabled.get() || isPeakHour();
    }

    public double getSurgeMultiplier() {
        return isSurgeActive() ? SURGE_MULTIPLIER : 1.0;
    }

    public void setAdminSurge(boolean enabled) {
        adminSurgeEnabled.set(enabled);
    }

    public String getSurgeReason() {
        if (adminSurgeEnabled.get()) return "High demand";
        if (isPeakHour()) return "Peak hours";
        return null;
    }
}
