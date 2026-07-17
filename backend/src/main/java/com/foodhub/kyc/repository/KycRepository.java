package com.foodhub.kyc.repository;

import com.foodhub.kyc.entity.KycDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KycRepository extends JpaRepository<KycDocument, Long> {
    Optional<KycDocument> findTopByUserIdOrderBySubmittedAtDesc(Long userId);
    List<KycDocument> findByStatusOrderBySubmittedAtDesc(KycDocument.KycStatus status);
    List<KycDocument> findAllByOrderBySubmittedAtDesc();
}
