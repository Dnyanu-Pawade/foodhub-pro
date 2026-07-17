package com.foodhub.kyc.entity;

import com.foodhub.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_documents")
@Data
@NoArgsConstructor
public class KycDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String documentType; // AADHAAR, LICENSE, PAN
    private String documentUrl;
    private String selfieUrl;

    @Enumerated(EnumType.STRING)
    private KycStatus status = KycStatus.PENDING;

    private String adminNote;

    @CreationTimestamp
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;

    public enum KycStatus { PENDING, APPROVED, REJECTED }
}
