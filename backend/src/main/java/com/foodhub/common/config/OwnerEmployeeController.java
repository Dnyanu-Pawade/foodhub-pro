package com.foodhub.common.config;

import com.foodhub.auth.entity.Role;
import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.RoleRepository;
import com.foodhub.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/owner/employees")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
@RequiredArgsConstructor
public class OwnerEmployeeController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> list(@RequestParam Long restaurantId) {
        return ResponseEntity.ok(userRepository.findByRoleName("ROLE_RESTAURANT_OWNER").stream()
                .filter(u -> u.getRestaurantId() != null && u.getRestaurantId().equals(restaurantId))
                .toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        User u = new User();
        u.setFullName((String) body.get("fullName"));
        u.setEmail((String) body.get("email"));
        u.setPhone((String) body.getOrDefault("phone", ""));
        u.setUsername((String) body.get("email"));
        u.setPassword(passwordEncoder.encode("Staff@123"));
        u.setEnabled(true);
        u.setStaffRole((String) body.getOrDefault("role", "CHEF"));
        Object rid = body.get("restaurantId");
        if (rid != null) u.setRestaurantId(Long.parseLong(rid.toString()));
        Role role = roleRepository.findByName(Role.ERole.ROLE_RESTAURANT_OWNER).orElseThrow();
        u.setRoles(Set.of(role));
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Employee added", "defaultPassword", "Staff@123"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Removed"));
    }
}
