package com.foodhub.delivery.service;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.delivery.dto.DeliveryDto;
import com.foodhub.delivery.entity.Delivery;
import com.foodhub.delivery.repository.DeliveryRepository;
import com.foodhub.order.entity.Order;
import com.foodhub.order.entity.Order.OrderStatus;
import com.foodhub.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // Admin assigns delivery partner to order
    @Transactional
    public DeliveryDto assignPartner(Long orderId, Long partnerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (deliveryRepository.findByOrderId(orderId).isPresent())
            throw new BadRequestException("Delivery already assigned for this order");

        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("Partner not found"));

        Delivery delivery = new Delivery();
        delivery.setOrder(order);
        delivery.setPartner(partner);
        delivery.setStatus(Delivery.DeliveryStatus.ASSIGNED);
        return toDto(deliveryRepository.save(delivery));
    }

    // Partner accepts and picks up
    @Transactional
    public DeliveryDto updateStatus(Long deliveryId, Delivery.DeliveryStatus newStatus, Long partnerId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found"));
        if (!delivery.getPartner().getId().equals(partnerId))
            throw new BadRequestException("Not your delivery");

        delivery.setStatus(newStatus);
        if (newStatus == Delivery.DeliveryStatus.PICKED_UP) delivery.setPickedUpAt(LocalDateTime.now());
        if (newStatus == Delivery.DeliveryStatus.DELIVERED) {
            delivery.setDeliveredAt(LocalDateTime.now());
            // Update order status
            Order order = delivery.getOrder();
            order.setStatus(OrderStatus.DELIVERED);
            orderRepository.save(order);
            messagingTemplate.convertAndSend("/topic/order/" + order.getId() + "/status", order.getStatus());
        }
        return toDto(deliveryRepository.save(delivery));
    }

    public List<DeliveryDto> getMyDeliveries(Long partnerId) {
        return deliveryRepository.findByPartnerId(partnerId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<DeliveryDto> getAvailableDeliveries() {
        // Show PLACED, CONFIRMED, PREPARING, READY_FOR_PICKUP orders that have no delivery assigned
        List<OrderStatus> pickable = List.of(
            OrderStatus.PLACED, OrderStatus.CONFIRMED,
            OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP
        );
        return orderRepository.findByStatusIn(pickable).stream()
                .filter(o -> deliveryRepository.findByOrderId(o.getId()).isEmpty())
                .map(o -> {
                    DeliveryDto dto = new DeliveryDto();
                    dto.setOrderId(o.getId());
                    dto.setRestaurantName(o.getRestaurant().getName());
                    dto.setRestaurantAddress(o.getRestaurant().getAddress());
                    dto.setDeliveryAddress(o.getDeliveryAddress());
                    dto.setDeliveryLat(o.getDeliveryLat());
                    dto.setDeliveryLng(o.getDeliveryLng());
                    dto.setTotalAmount(o.getTotalAmount());
                    dto.setStatus(o.getStatus().name());
                    return dto;
                }).toList();
    }

    // Partner self-assigns — also advances order to CONFIRMED so customer sees progress
    @Transactional
    public DeliveryDto acceptDelivery(Long orderId, Long partnerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (deliveryRepository.findByOrderId(orderId).isPresent())
            throw new BadRequestException("Already taken by another partner");
        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("Partner not found"));
        // Auto-advance order status so customer sees it moving
        if (order.getStatus() == OrderStatus.PLACED)
            order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        Delivery delivery = new Delivery();
        delivery.setOrder(order);
        delivery.setPartner(partner);
        delivery.setStatus(Delivery.DeliveryStatus.ASSIGNED);
        DeliveryDto dto = toDto(deliveryRepository.save(delivery));
        messagingTemplate.convertAndSend("/topic/order/" + orderId + "/status", order.getStatus());
        return dto;
    }

    public Map<String, Object> getEarnings(Long partnerId) {
        List<Delivery> delivered = deliveryRepository.findByPartnerId(partnerId).stream()
                .filter(d -> d.getStatus() == Delivery.DeliveryStatus.DELIVERED).toList();

        BigDecimal total = delivered.stream()
                .map(d -> BigDecimal.valueOf(30)) // flat ₹30 per delivery
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long today = delivered.stream()
                .filter(d -> d.getDeliveredAt() != null &&
                             d.getDeliveredAt().toLocalDate().equals(LocalDate.now()))
                .count();

        long thisMonth = delivered.stream()
                .filter(d -> d.getDeliveredAt() != null &&
                             d.getDeliveredAt().getMonth() == LocalDateTime.now().getMonth())
                .count();

        return Map.of(
                "totalDeliveries", delivered.size(),
                "todayDeliveries", today,
                "monthDeliveries", thisMonth,
                "totalEarnings", total,
                "todayEarnings", BigDecimal.valueOf(today * 30),
                "monthEarnings", BigDecimal.valueOf(thisMonth * 30)
        );
    }

    private DeliveryDto toDto(Delivery d) {
        DeliveryDto dto = new DeliveryDto();
        dto.setId(d.getId());
        dto.setOrderId(d.getOrder().getId());
        dto.setPartnerId(d.getPartner().getId());
        dto.setPartnerName(d.getPartner().getFullName());
        dto.setStatus(d.getStatus().name());
        dto.setCurrentLatitude(d.getCurrentLatitude());
        dto.setCurrentLongitude(d.getCurrentLongitude());
        dto.setPickedUpAt(d.getPickedUpAt());
        dto.setDeliveredAt(d.getDeliveredAt());
        dto.setRestaurantName(d.getOrder().getRestaurant().getName());
        dto.setRestaurantAddress(d.getOrder().getRestaurant().getAddress());
        dto.setDeliveryAddress(d.getOrder().getDeliveryAddress());
        dto.setDeliveryLat(d.getOrder().getDeliveryLat());
        dto.setDeliveryLng(d.getOrder().getDeliveryLng());
        dto.setTotalAmount(d.getOrder().getTotalAmount());
        return dto;
    }
}
