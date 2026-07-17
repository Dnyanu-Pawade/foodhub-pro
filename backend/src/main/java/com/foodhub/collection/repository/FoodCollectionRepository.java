package com.foodhub.collection.repository;

import com.foodhub.collection.entity.FoodCollection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoodCollectionRepository extends JpaRepository<FoodCollection, Long> {
    List<FoodCollection> findByActiveTrueOrderByDisplayOrderAsc();
}
