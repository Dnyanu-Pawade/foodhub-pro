package com.foodhub.loyalty.repository;

import com.foodhub.loyalty.entity.LoyaltyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {
    List<LoyaltyTransaction> findByAccountIdOrderByCreatedAtDesc(Long accountId);
}
