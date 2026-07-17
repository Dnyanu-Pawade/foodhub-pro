package com.foodhub.order.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.order.entity.GroupCart;
import com.foodhub.order.repository.GroupCartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/group-cart")
@RequiredArgsConstructor
public class GroupCartController {

    private final GroupCartRepository groupCartRepository;

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private String generateCode() {
        StringBuilder sb = new StringBuilder(6);
        Random rnd = new Random();
        for (int i = 0; i < 6; i++) sb.append(CHARS.charAt(rnd.nextInt(CHARS.length())));
        return sb.toString();
    }

    @PostMapping("/create")
    public ResponseEntity<GroupCart> create(@RequestBody Map<String, Object> body,
                                             @AuthenticationPrincipal UserDetailsImpl user) {
        GroupCart gc = new GroupCart();
        String code;
        do { code = generateCode(); } while (groupCartRepository.findByCodeAndActiveTrue(code).isPresent());
        gc.setCode(code);
        gc.setRestaurantId(Long.valueOf(body.get("restaurantId").toString()));
        gc.setRestaurantName(body.get("restaurantName").toString());
        gc.setCreatedByUserId(user.getId());
        gc.setCreatedByName(user.getUsername());
        gc.setItemsJson(body.getOrDefault("itemsJson", "[]").toString());
        return ResponseEntity.ok(groupCartRepository.save(gc));
    }

    @GetMapping("/{code}")
    public ResponseEntity<GroupCart> get(@PathVariable String code) {
        return ResponseEntity.ok(
            groupCartRepository.findByCodeAndActiveTrue(code)
                .orElseThrow(() -> new ResourceNotFoundException("Group cart not found or expired"))
        );
    }

    @PutMapping("/{code}/items")
    public ResponseEntity<GroupCart> updateItems(@PathVariable String code,
                                                  @RequestBody Map<String, String> body) {
        GroupCart gc = groupCartRepository.findByCodeAndActiveTrue(code)
                .orElseThrow(() -> new ResourceNotFoundException("Group cart not found"));
        gc.setItemsJson(body.get("itemsJson"));
        return ResponseEntity.ok(groupCartRepository.save(gc));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> close(@PathVariable String code,
                                       @AuthenticationPrincipal UserDetailsImpl user) {
        groupCartRepository.findByCodeAndActiveTrue(code).ifPresent(gc -> {
            gc.setActive(false);
            groupCartRepository.save(gc);
        });
        return ResponseEntity.ok().build();
    }
}
