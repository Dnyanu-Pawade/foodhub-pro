package com.foodhub.delivery.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.common.service.S3UploadService;
import com.foodhub.delivery.dto.DeliveryDto;
import com.foodhub.delivery.dto.LocationUpdate;
import com.foodhub.delivery.entity.Delivery;
import com.foodhub.delivery.repository.DeliveryRepository;
import com.foodhub.delivery.service.DeliveryService;
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
}
