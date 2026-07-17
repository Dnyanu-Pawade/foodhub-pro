package com.foodhub.address.controller;

import com.foodhub.address.entity.Address;
import com.foodhub.address.repository.AddressRepository;
import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/addresses")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
@Tag(name = "Addresses")
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Address>> list(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(
                addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Address> create(@RequestBody Address body,
                                          @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        if (body.isDefault()) addressRepository.clearDefaults(user.getId());
        body.setId(null);
        body.setUser(user);
        return ResponseEntity.ok(addressRepository.save(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Address> update(@PathVariable Long id,
                                          @RequestBody Address body,
                                          @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Address existing = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!existing.getUser().getId().equals(userDetails.getId()))
            return ResponseEntity.status(403).build();
        if (body.isDefault()) addressRepository.clearDefaults(userDetails.getId());
        existing.setLabel(body.getLabel());
        existing.setFullAddress(body.getFullAddress());
        existing.setCity(body.getCity());
        existing.setPincode(body.getPincode());
        existing.setDefault(body.isDefault());
        return ResponseEntity.ok(addressRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Address existing = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!existing.getUser().getId().equals(userDetails.getId()))
            return ResponseEntity.status(403).build();
        addressRepository.delete(existing);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/set-default")
    public ResponseEntity<Map<String, Boolean>> setDefault(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Address existing = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!existing.getUser().getId().equals(userDetails.getId()))
            return ResponseEntity.status(403).build();
        addressRepository.clearDefaults(userDetails.getId());
        existing.setDefault(true);
        addressRepository.save(existing);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
