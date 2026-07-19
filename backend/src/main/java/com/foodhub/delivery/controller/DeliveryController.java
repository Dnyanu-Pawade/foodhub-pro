package com.foodhub.delivery.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.common.service.S3UploadService;
import com.foodhub.delivery.dto.DeliveryDto;
import com.foodhub.delivery.dto.LocationUpdate;
import com.foodhub.delivery.entity.Delivery;
import com.foodhub.delivery.repository.DeliveryRepository;
import com.foodhub.delivery.service.DeliveryService;
import com.foodhub.payout.repository.DeliveryPayoutRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Delivery")
public class DeliveryController {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryService deliveryService;
    private final SimpMessagingTemplate messagingTemplate;
    private final S3UploadService s3UploadService;
    private final DeliveryPayoutRepository deliveryPayoutRepository;
    private final com.foodhub.auth.repository.UserRepository userRepository;

    @GetMapping("/api/delivery/available")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<List<DeliveryDto>> getAvailable() {
        return ResponseEntity.ok(deliveryService.getAvailableDeliveries());
    }

    @GetMapping("/api/delivery/my")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<List<DeliveryDto>> myDeliveries(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(deliveryService.getMyDeliveries(user.getId()));
    }

    @PostMapping("/api/delivery/accept/{orderId}")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<DeliveryDto> accept(@PathVariable Long orderId,
                                               @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(deliveryService.acceptDelivery(orderId, user.getId()));
    }

    @PatchMapping("/api/delivery/{id}/status")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<DeliveryDto> updateStatus(@PathVariable Long id,
                                                     @RequestParam Delivery.DeliveryStatus status,
                                                     @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(deliveryService.updateStatus(id, status, user.getId()));
    }

    @GetMapping("/api/delivery/earnings")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<Map<String, Object>> earnings(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(deliveryService.getEarnings(user.getId()));
    }

    @PostMapping("/api/admin/delivery/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DeliveryDto> assign(@RequestParam Long orderId, @RequestParam Long partnerId) {
        return ResponseEntity.ok(deliveryService.assignPartner(orderId, partnerId));
    }

    @GetMapping("/api/delivery/location/{orderId}")
    public ResponseEntity<Map<String, Object>> getLocation(@PathVariable Long orderId) {
        return deliveryRepository.findByOrderId(orderId)
                .filter(d -> d.getCurrentLatitude() != null)
                .map(d -> ResponseEntity.ok(Map.<String, Object>of(
                        "orderId", orderId,
                        "latitude", d.getCurrentLatitude(),
                        "longitude", d.getCurrentLongitude(),
                        "status", d.getStatus().name()
                )))
                .orElse(ResponseEntity.noContent().build());
    }

    @MessageMapping("/delivery/location")
    public void updateLocation(LocationUpdate update) {
        deliveryRepository.findByOrderId(update.getOrderId()).ifPresent(delivery -> {
            delivery.setCurrentLatitude(update.getLatitude());
            delivery.setCurrentLongitude(update.getLongitude());
            deliveryRepository.save(delivery);
        });
        messagingTemplate.convertAndSend("/topic/order/" + update.getOrderId() + "/location", update);
    }

    @PostMapping("/api/delivery/{id}/proof-photo")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<Map<String, String>> uploadProof(@PathVariable Long id,
                                                            @RequestParam("file") MultipartFile file,
                                                            @AuthenticationPrincipal UserDetailsImpl user) throws Exception {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found"));
        String url = s3UploadService.upload(file, "delivery-proof");
        delivery.setDeliveryPhotoUrl(url);
        deliveryRepository.save(delivery);
        return ResponseEntity.ok(Map.of("url", url));
    }

    // ── Delivery Partner Payouts ──────────────────────────────────────────

    @GetMapping("/api/delivery/payouts")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<List<com.foodhub.payout.entity.DeliveryPayoutRequest>> getMyPayouts(
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(
            deliveryPayoutRepository.findByPartnerIdOrderByCreatedAtDesc(user.getId()));
    }

    @PostMapping("/api/delivery/payouts/request")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<com.foodhub.payout.entity.DeliveryPayoutRequest> requestPayout(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl user) {
        Map<String, Object> earnings = deliveryService.getEarnings(user.getId());
        java.math.BigDecimal totalEarned = new java.math.BigDecimal(earnings.get("totalEarnings").toString());
        java.math.BigDecimal alreadyPaid = deliveryPayoutRepository
                .findByPartnerIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(p -> p.getStatus() == com.foodhub.payout.entity.DeliveryPayoutRequest.PayoutStatus.COMPLETED)
                .map(p -> p.getAmount())
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal pending = totalEarned.subtract(alreadyPaid);
        if (pending.compareTo(java.math.BigDecimal.valueOf(100)) < 0)
            throw new com.foodhub.common.exception.BadRequestException("Minimum payout is ₹100");
        com.foodhub.auth.entity.User partner = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        com.foodhub.payout.entity.DeliveryPayoutRequest req = new com.foodhub.payout.entity.DeliveryPayoutRequest();
        req.setPartner(partner);
        req.setAmount(pending);
        req.setBankAccount(body.get("bankAccount"));
        req.setIfscCode(body.get("ifscCode"));
        req.setAccountHolderName(body.get("accountHolderName"));
        req.setUpiId(body.get("upiId"));
        return ResponseEntity.ok(deliveryPayoutRepository.save(req));
    }
}
