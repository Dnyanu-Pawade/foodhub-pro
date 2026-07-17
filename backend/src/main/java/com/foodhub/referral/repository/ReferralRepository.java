package com.foodhub.referral.repository;

import com.foodhub.referral.entity.Referral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReferralRepository extends JpaRepository<Referral, Long> {
    Optional<Referral> findByRefereeId(Long refereeId);
    List<Referral> findByReferrerId(Long referrerId);
    long countByReferrerIdAndRewardCreditedTrue(Long referrerId);
}
