package com.foodhub.complaint.entity;

import com.foodhub.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Long orderId;
    private String subject;

    @Transient
    public String getCustomerName() { return user != null ? user.getFullName() : ""; }
    @Transient
    public String getCustomerEmail() { return user != null ? user.getEmail() : ""; }

    @Enumerated(EnumType.STRING)
    private ComplaintType type = ComplaintType.OTHER;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private ComplaintStatus status = ComplaintStatus.OPEN;

    @Column(columnDefinition = "TEXT")
    private String adminResponse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;

    public enum ComplaintType { WRONG_ORDER, LATE_DELIVERY, QUALITY_ISSUE, PAYMENT_ISSUE, OTHER }
    public enum ComplaintStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }
}
