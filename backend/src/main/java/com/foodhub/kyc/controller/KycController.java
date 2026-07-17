package com.foodhub.kyc.controller;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.common.service.S3UploadService;
import com.foodhub.kyc.entity.KycDocument;
import com.foodhub.kyc.repository.KycRepository;
import com.foodhub.order.repository.OrderRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kyc")
@RequiredArgsConstructor
@Tag(name = "KYC")
public class KycController {

    private final KycRepository kycRepository;
    private final UserRepository userRepository;
    private final S3UploadService s3UploadService;
    private final OrderRepository orderRepository;

    // Delivery partner submits KYC
    @PostMapping("/submit")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    @Transactional
    public ResponseEntity<Map<String, Object>> submit(
            @RequestParam("documentType") String documentType,
            @RequestParam("document") MultipartFile document,
            @RequestParam(value = "selfie", required = false) MultipartFile selfie,
            @AuthenticationPrincipal UserDetailsImpl u) throws Exception {

        User user = userRepository.findById(u.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String docUrl     = s3UploadService.upload(document, "kyc");
        String selfieUrl  = selfie != null ? s3UploadService.upload(selfie, "kyc-selfie") : null;

        KycDocument kyc = kycRepository.findTopByUserIdOrderBySubmittedAtDesc(u.getId())
                .orElse(new KycDocument());
        kyc.setUser(user);
        kyc.setDocumentType(documentType);
        kyc.setDocumentUrl(docUrl);
        kyc.setSelfieUrl(selfieUrl);
        kyc.setStatus(KycDocument.KycStatus.PENDING);
        kycRepository.save(kyc);

        return ResponseEntity.ok(Map.of("message", "KYC submitted for review", "status", "PENDING"));
    }

    // Get my KYC status
    @GetMapping("/my-status")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<Map<String, Object>> myStatus(@AuthenticationPrincipal UserDetailsImpl u) {
        return kycRepository.findTopByUserIdOrderBySubmittedAtDesc(u.getId())
                .map(k -> ResponseEntity.ok(Map.<String, Object>of(
                        "status", k.getStatus().name(),
                        "documentType", k.getDocumentType(),
                        "submittedAt", k.getSubmittedAt().toString(),
                        "adminNote", k.getAdminNote() != null ? k.getAdminNote() : ""
                )))
                .orElse(ResponseEntity.ok(Map.of("status", "NOT_SUBMITTED")));
    }

    // Admin: list all KYC
    @GetMapping("/admin/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<KycDocument>> listAll(@RequestParam(required = false) String status) {
        if (status != null)
            return ResponseEntity.ok(kycRepository.findByStatusOrderBySubmittedAtDesc(KycDocument.KycStatus.valueOf(status)));
        return ResponseEntity.ok(kycRepository.findAllByOrderBySubmittedAtDesc());
    }

    // Admin: approve/reject KYC
    @PatchMapping("/admin/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<KycDocument> review(@PathVariable Long id,
                                               @RequestParam KycDocument.KycStatus status,
                                               @RequestParam(required = false) String note) {
        KycDocument kyc = kycRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KYC not found"));
        kyc.setStatus(status);
        kyc.setAdminNote(note);
        kyc.setReviewedAt(LocalDateTime.now());
        return ResponseEntity.ok(kycRepository.save(kyc));
    }

    // Fraud detection: flag users with >3 cancellations in 7 days
    @GetMapping("/admin/fraud-flags")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> fraudFlags() {
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        return ResponseEntity.ok(
            orderRepository.findAll().stream()
                .filter(o -> o.getStatus().name().equals("CANCELLED")
                        && o.getCreatedAt().isAfter(since))
                .collect(java.util.stream.Collectors.groupingBy(
                        o -> o.getCustomer().getId(),
                        java.util.stream.Collectors.counting()))
                .entrySet().stream()
                .filter(e -> e.getValue() >= 3)
                .map(e -> {
                    User u = userRepository.findById(e.getKey()).orElse(null);
                    return Map.<String, Object>of(
                            "userId", e.getKey(),
                            "username", u != null ? u.getUsername() : "unknown",
                            "email", u != null ? u.getEmail() : "",
                            "cancellations", e.getValue(),
                            "isActive", u != null && u.isActive()
                    );
                }).toList()
        );
    }
}
