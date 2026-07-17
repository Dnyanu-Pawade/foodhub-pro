package com.foodhub.order.service;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.menu.entity.MenuItem;
import com.foodhub.menu.repository.MenuItemRepository;
import com.foodhub.order.dto.OrderRequest;
import com.foodhub.order.dto.OrderResponse;
import com.foodhub.order.entity.Order;
import com.foodhub.order.entity.Order.OrderStatus;
import com.foodhub.order.entity.OrderItem;
import com.foodhub.order.repository.OrderRepository;
import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.loyalty.controller.LoyaltyController;
import com.foodhub.delivery.repository.DeliveryRepository;
import com.foodhub.common.service.SurgeService;
import com.foodhub.notification.entity.Notification.NotificationType;
import com.foodhub.notification.service.NotificationHelper;
import com.foodhub.notification.service.EmailService;
import com.foodhub.notification.service.NotificationService;
import com.foodhub.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final NotificationHelper notificationHelper;
    private final LoyaltyController loyaltyController;
    private final SurgeService surgeService;
    private final DeliveryRepository deliveryRepository;

    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS;

    static {
        TRANSITIONS = new EnumMap<>(OrderStatus.class);
        TRANSITIONS.put(OrderStatus.PLACED,           Set.of(OrderStatus.CONFIRMED, OrderStatus.REJECTED));
        TRANSITIONS.put(OrderStatus.CONFIRMED,        Set.of(OrderStatus.PREPARING, OrderStatus.CANCELLED));
        TRANSITIONS.put(OrderStatus.PREPARING,        Set.of(OrderStatus.READY_FOR_PICKUP));
        TRANSITIONS.put(OrderStatus.READY_FOR_PICKUP, Set.of(OrderStatus.PICKED_UP));
        TRANSITIONS.put(OrderStatus.PICKED_UP,        Set.of(OrderStatus.DELIVERED));
        TRANSITIONS.put(OrderStatus.REJECTED,         Set.of());
        TRANSITIONS.put(OrderStatus.DELIVERED,        Set.of());
        TRANSITIONS.put(OrderStatus.CANCELLED,        Set.of());
    }

    @Transactional
    public OrderResponse placeGuestOrder(OrderRequest request) {
        // Find or create a stable guest user (one per phone number, or a single fallback)
        String guestPhone = (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank())
                ? request.getCustomerPhone() : "0000000000";
        String guestName  = (request.getCustomerName()  != null && !request.getCustomerName().isBlank())
                ? request.getCustomerName() : "Guest";
        String guestUsername = "guest_" + guestPhone;
        String guestEmail    = "guest_" + guestPhone + "@foodhub.com";

        User guest = userRepository.findByUsername(guestUsername).orElseGet(() -> {
            User g = new User(guestUsername, guestEmail, "NOLOGIN", guestName, guestPhone);
            g.setRoles(Set.of());
            return userRepository.save(g);
        });
        return placeOrder(request, guest.getId());
    }

    @Transactional
    public OrderResponse placeOrder(OrderRequest request, Long customerId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Restaurant restaurant = restaurantRepository.findByIdAndDeletedAtIsNull(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

        Order order = new Order();
        order.setCustomer(customer);
        order.setRestaurant(restaurant);
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setDeliveryCity(request.getDeliveryCity());
        order.setDeliveryPincode(request.getDeliveryPincode());
        order.setDeliveryLat(request.getDeliveryLat());
        order.setDeliveryLng(request.getDeliveryLng());
        order.setCouponCode(request.getCouponCode());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus("PENDING");
        order.setSpecialInstructions(request.getSpecialInstructions());
        order.setTableNumber(request.getTableNumber());

        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findByIdAndDeletedAtIsNull(itemReq.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu item not found: " + itemReq.getMenuItemId()));
            if (!menuItem.isAvailable())
                throw new BadRequestException("Item not available: " + menuItem.getName());

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setMenuItem(menuItem);
            oi.setItemName(menuItem.getName());
            oi.setUnitPrice(menuItem.getPrice());
            oi.setQuantity(itemReq.getQuantity());
            oi.setTotalPrice(menuItem.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())));
            order.getOrderItems().add(oi);
            subtotal = subtotal.add(oi.getTotalPrice());
        }

        BigDecimal deliveryFee = BigDecimal.valueOf(restaurant.getDeliveryFee() * surgeService.getSurgeMultiplier());
        order.setSubtotal(subtotal);
        order.setDeliveryFee(deliveryFee);
        order.setDiscount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal.add(deliveryFee));

        Order saved = orderRepository.save(order);
        messagingTemplate.convertAndSend("/topic/restaurant/" + restaurant.getId() + "/orders", toResponse(saved));
        emailService.sendOrderConfirmation(customer.getEmail(), customer.getFullName(),
                saved.getId(), restaurant.getName(), saved.getTotalAmount().toPlainString());
        notificationService.sendOrderConfirmation(customer.getPhone(), customer.getFullName(),
                saved.getId(), restaurant.getName());
        notificationService.sendOrderConfirmationWhatsApp(customer.getPhone(), customer.getFullName(),
                saved.getId(), restaurant.getName(), saved.getTotalAmount().toPlainString());
        notificationHelper.orderUpdate(customer.getId(), saved.getId(), "PLACED");
        notificationHelper.newOrder(restaurant.getOwner().getId(), saved.getId(), customer.getFullName());
        return toResponse(saved);
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus newStatus, Long actorId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Set<OrderStatus> allowed = TRANSITIONS.getOrDefault(order.getStatus(), Set.of());
        if (!allowed.contains(newStatus))
            throw new BadRequestException("Invalid transition: " + order.getStatus() + " -> " + newStatus);

        order.setStatus(newStatus);
        // Generate OTP when order is ready for pickup
        if (newStatus == OrderStatus.READY_FOR_PICKUP) {
            String otp = String.format("%04d", new Random().nextInt(10000));
            order.setDeliveryOtp(otp);
            notificationHelper.push(order.getCustomer().getId(),
                "Your delivery OTP",
                "Show OTP " + otp + " to delivery partner for Order #" + order.getId(),
                NotificationType.ORDER_UPDATE, "/orders/" + order.getId(), order.getId());
        }
        Order saved = orderRepository.save(order);
        messagingTemplate.convertAndSend("/topic/order/" + orderId + "/status", toResponse(saved));
        notificationHelper.orderUpdate(saved.getCustomer().getId(), orderId, newStatus.name());
        notificationService.sendOrderStatusUpdate(
            saved.getCustomer().getPhone(),
            saved.getCustomer().getFullName(),
            orderId, newStatus.name());
        if (newStatus == OrderStatus.DELIVERED) {
            String email = saved.getCustomer().getEmail();
            String phone = saved.getCustomer().getPhone();
            String name  = saved.getCustomer().getFullName();
            emailService.sendOrderDelivered(email, name, orderId);
            notificationService.sendOrderDelivered(phone, name, orderId);
            loyaltyController.earnPoints(saved.getCustomer().getId(), saved.getTotalAmount(), orderId);
        }
        return toResponse(saved);
    }

    // Customer shares live GPS location — broadcast to delivery partner
    @Transactional
    public void updateCustomerLocation(Long orderId, Long customerId, Double lat, Double lng) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getCustomer().getId().equals(customerId))
            throw new BadRequestException("Not your order");
        order.setDeliveryLat(lat);
        order.setDeliveryLng(lng);
        orderRepository.save(order);
        messagingTemplate.convertAndSend("/topic/order/" + orderId + "/customer-location",
                Map.of("orderId", orderId, "latitude", lat, "longitude", lng));
    }

    public Page<OrderResponse> getMyOrders(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::toResponse);
    }

    public List<OrderResponse> getRestaurantOrders(Long restaurantId) {
        return orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId)
                .stream().map(this::toResponse).toList();
    }

    public OrderResponse getById(Long orderId) {
        return toResponse(orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found")));
    }

    @Transactional
    public void verifyDeliveryOtp(Long orderId, Long partnerId, String otp) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getDeliveryOtp() == null || !order.getDeliveryOtp().equals(otp))
            throw new BadRequestException("Invalid OTP");
        // OTP verified — mark as delivered
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveryOtp(null);
        Order saved = orderRepository.save(order);
        messagingTemplate.convertAndSend("/topic/order/" + orderId + "/status", toResponse(saved));
        notificationHelper.orderUpdate(saved.getCustomer().getId(), orderId, "DELIVERED");
        loyaltyController.earnPoints(saved.getCustomer().getId(), saved.getTotalAmount(), orderId);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long customerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getCustomer().getId().equals(customerId))
            throw new BadRequestException("Not your order");
        if (!Set.of(OrderStatus.PLACED, OrderStatus.CONFIRMED).contains(order.getStatus()))
            throw new BadRequestException("Order cannot be cancelled at this stage");
        if (order.getCreatedAt().isBefore(java.time.LocalDateTime.now().minusMinutes(2))
                && order.getStatus() == OrderStatus.PLACED)
            throw new BadRequestException("Cancellation window (2 min) has passed");
        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);
        messagingTemplate.convertAndSend("/topic/order/" + orderId + "/status", toResponse(saved));
        notificationHelper.orderUpdate(customerId, orderId, "CANCELLED");
        return toResponse(saved);
    }

    public List<OrderResponse> getScheduledOrders(Long customerId) {
        return orderRepository
            .findByCustomerIdAndScheduledAtIsNotNullAndStatusOrderByScheduledAtAsc(
                customerId, OrderStatus.PLACED)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void cancelScheduledOrder(Long orderId, Long customerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getCustomer().getId().equals(customerId))
            throw new BadRequestException("Not your order");
        if (order.getScheduledAt() == null)
            throw new BadRequestException("Not a scheduled order");
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    private OrderResponse toResponse(Order order) {
        OrderResponse r = new OrderResponse();
        r.setId(order.getId());
        r.setCustomerId(order.getCustomer().getId());
        r.setCustomerName(order.getCustomer().getFullName());
        r.setRestaurantId(order.getRestaurant().getId());
        r.setRestaurantName(order.getRestaurant().getName());
        r.setStatus(order.getStatus());
        r.setDeliveryAddress(order.getDeliveryAddress());
        r.setSubtotal(order.getSubtotal());
        r.setDeliveryFee(order.getDeliveryFee());
        r.setDiscount(order.getDiscount());
        r.setTotalAmount(order.getTotalAmount());
        r.setCouponCode(order.getCouponCode());
        r.setPaymentMethod(order.getPaymentMethod());
        r.setPaymentStatus(order.getPaymentStatus());
        r.setSpecialInstructions(order.getSpecialInstructions());
        r.setCreatedAt(order.getCreatedAt());
        r.setRestaurantLat(order.getRestaurant().getLatitude());
        r.setRestaurantLng(order.getRestaurant().getLongitude());
        r.setDeliveryLat(order.getDeliveryLat());
        r.setDeliveryLng(order.getDeliveryLng());
        r.setAvgDeliveryTimeMinutes(order.getRestaurant().getAvgDeliveryTimeMinutes());
        r.setDeliveryOtp(order.getDeliveryOtp());
        if (order.getScheduledAt() != null)
            r.setScheduledAt(order.getScheduledAt().toString());
        deliveryRepository.findByOrderId(order.getId())
                .ifPresent(d -> r.setDeliveryPhotoUrl(d.getDeliveryPhotoUrl()));
        r.setItems(order.getOrderItems().stream().map(oi -> {
            OrderResponse.OrderItemResponse ir = new OrderResponse.OrderItemResponse();
            ir.setId(oi.getId());
            ir.setMenuItemId(oi.getMenuItem().getId());
            ir.setItemName(oi.getItemName());
            ir.setUnitPrice(oi.getUnitPrice());
            ir.setQuantity(oi.getQuantity());
            ir.setTotalPrice(oi.getTotalPrice());
            return ir;
        }).toList());
        return r;
    }
}
