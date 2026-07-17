package com.foodhub.booking.repository;

import com.foodhub.booking.entity.TableBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TableBookingRepository extends JpaRepository<TableBooking, Long> {
    List<TableBooking> findByCustomerIdOrderByBookingDateDescBookingTimeDesc(Long customerId);
    List<TableBooking> findByRestaurantIdOrderByBookingDateDescBookingTimeDesc(Long restaurantId);
}
