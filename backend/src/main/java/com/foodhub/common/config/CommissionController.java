package com.foodhub.common.config;

import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/commissions")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CommissionController {

    private final RestaurantRepository restaurantRepository;

    @GetMapping
    public ResponseEntity<List<Restaurant>> getAll() {
        return ResponseEntity.ok(restaurantRepository.findAll());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        Object rate = body.get("commissionRate");
        if (rate != null) r.setCommissionRate(Double.parseDouble(rate.toString()));
        restaurantRepository.save(r);
        return ResponseEntity.ok(Map.of("message", "Updated"));
    }
}
