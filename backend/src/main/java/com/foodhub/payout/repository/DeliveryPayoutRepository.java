package com.foodhub.payout.repository;

import com.foodhub.payout.entity.DeliveryPayoutRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryPayoutRepository extends JpaRepository<DeliveryPayoutRequest, Long> {
    List<DeliveryPayoutRequest> findByPartnerIdOrderByCreatedAtDesc(Long partnerId);
    List<DeliveryPayoutRequest> findAllByOrderByCreatedAtDesc();
}
