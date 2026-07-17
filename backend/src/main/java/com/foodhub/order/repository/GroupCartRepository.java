package com.foodhub.order.repository;

import com.foodhub.order.entity.GroupCart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GroupCartRepository extends JpaRepository<GroupCart, Long> {
    Optional<GroupCart> findByCodeAndActiveTrue(String code);
}
