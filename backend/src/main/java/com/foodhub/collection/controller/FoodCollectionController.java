package com.foodhub.collection.controller;

import com.foodhub.collection.entity.FoodCollection;
import com.foodhub.collection.repository.FoodCollectionRepository;
import com.foodhub.restaurant.dto.RestaurantDto;
import com.foodhub.restaurant.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class FoodCollectionController {

    private final FoodCollectionRepository collectionRepository;
    private final RestaurantService restaurantService;

    // Public — get all active collections
    @GetMapping
    public ResponseEntity<List<FoodCollection>> getAll() {
        return ResponseEntity.ok(collectionRepository.findByActiveTrueOrderByDisplayOrderAsc());
    }

    // Public — get restaurants for a collection tag
    @GetMapping("/{id}/restaurants")
    public ResponseEntity<?> getRestaurants(@PathVariable Long id,
                                             @RequestParam(defaultValue = "0") int page) {
        FoodCollection col = collectionRepository.findById(id).orElse(null);
        if (col == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(
            restaurantService.search(null, null, col.getTag(),
                null, null, null, null, "rating",
                PageRequest.of(page, 10))
        );
    }

    // Admin — create collection
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FoodCollection> create(@RequestBody FoodCollection col) {
        return ResponseEntity.ok(collectionRepository.save(col));
    }

    // Admin — update collection
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FoodCollection> update(@PathVariable Long id,
                                                  @RequestBody FoodCollection body) {
        FoodCollection col = collectionRepository.findById(id)
                .orElseThrow(() -> new com.foodhub.common.exception.ResourceNotFoundException("Collection not found"));
        col.setTitle(body.getTitle());
        col.setEmoji(body.getEmoji());
        col.setDescription(body.getDescription());
        col.setImageUrl(body.getImageUrl());
        col.setTag(body.getTag());
        col.setActive(body.isActive());
        col.setDisplayOrder(body.getDisplayOrder());
        return ResponseEntity.ok(collectionRepository.save(col));
    }

    // Admin — delete collection
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        collectionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
