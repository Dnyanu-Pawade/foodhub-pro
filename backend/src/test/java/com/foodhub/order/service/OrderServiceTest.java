package com.foodhub.order.service;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.menu.entity.MenuItem;
import com.foodhub.menu.repository.MenuItemRepository;
import com.foodhub.order.dto.OrderRequest;
import com.foodhub.order.entity.Order;
import com.foodhub.order.entity.Order.OrderStatus;
import com.foodhub.order.repository.OrderRepository;
import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.repository.RestaurantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock UserRepository userRepository;
    @Mock RestaurantRepository restaurantRepository;
    @Mock MenuItemRepository menuItemRepository;
    @Mock SimpMessagingTemplate messagingTemplate;
    @InjectMocks OrderService orderService;

    @Test
    void placeOrder_success() {
        User customer = new User(); customer.setId(1L); customer.setFullName("Test");

        Restaurant restaurant = new Restaurant();
        restaurant.setId(1L); restaurant.setName("Test Restaurant");
        restaurant.setDeliveryFee(30.0);

        MenuItem item = new MenuItem();
        item.setId(1L); item.setName("Pizza");
        item.setPrice(BigDecimal.valueOf(200)); item.setAvailable(true);

        OrderRequest.OrderItemRequest itemReq = new OrderRequest.OrderItemRequest();
        itemReq.setMenuItemId(1L); itemReq.setQuantity(2);

        OrderRequest req = new OrderRequest();
        req.setRestaurantId(1L);
        req.setDeliveryAddress("123 Main St");
        req.setPaymentMethod("COD");
        req.setItems(List.of(itemReq));

        Order savedOrder = new Order();
        savedOrder.setId(1L); savedOrder.setCustomer(customer);
        savedOrder.setRestaurant(restaurant); savedOrder.setStatus(OrderStatus.PLACED);
        savedOrder.setSubtotal(BigDecimal.valueOf(400));
        savedOrder.setDeliveryFee(BigDecimal.valueOf(30));
        savedOrder.setDiscount(BigDecimal.ZERO);
        savedOrder.setTotalAmount(BigDecimal.valueOf(430));
        savedOrder.setPaymentMethod("COD"); savedOrder.setPaymentStatus("PENDING");

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(restaurantRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(item));
        when(orderRepository.save(any())).thenReturn(savedOrder);

        var response = orderService.placeOrder(req, 1L);
        assertThat(response.getStatus()).isEqualTo(OrderStatus.PLACED);
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(430));
    }

    @Test
    void updateStatus_invalidTransition_throws() {
        Order order = new Order();
        order.setId(1L); order.setStatus(OrderStatus.DELIVERED);

        User customer = new User(); customer.setId(1L);
        Restaurant restaurant = new Restaurant(); restaurant.setId(1L);
        order.setCustomer(customer); order.setRestaurant(restaurant);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus(1L, OrderStatus.PLACED, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid transition");
    }
}
