package com.foodhub.order.repository;

import com.foodhub.order.entity.Order;
import com.foodhub.order.entity.OrderItem;
import com.foodhub.order.entity.Order.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);
    List<Order> findByRestaurantIdAndStatusOrderByCreatedAtDesc(Long restaurantId, OrderStatus status);
    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
    List<Order> findByStatus(OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.createdAt > :since")
    int countByRestaurantIdAndCreatedAtAfter(@Param("restaurantId") Long restaurantId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt > :since AND o.status != 'CANCELLED'")
    long countRecentOrders(@Param("since") LocalDateTime since);

    @Query("SELECT o.restaurant.id, COUNT(o) as cnt FROM Order o WHERE o.createdAt > :since AND o.status != 'CANCELLED' GROUP BY o.restaurant.id ORDER BY cnt DESC")
    List<Object[]> findTrendingRestaurantIds(@Param("since") LocalDateTime since, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT DISTINCT oi.menuItem.id FROM OrderItem oi WHERE oi.order.restaurant.id = :restaurantId AND oi.order.createdAt > :since GROUP BY oi.menuItem.id ORDER BY COUNT(oi) DESC")
    List<Long> findTopMenuItemIds(@Param("restaurantId") Long restaurantId, @Param("since") LocalDateTime since, org.springframework.data.domain.Pageable pageable);

    List<Order> findByCustomerIdAndScheduledAtIsNotNullAndStatusOrderByScheduledAtAsc(
            Long customerId, Order.OrderStatus status);
}
