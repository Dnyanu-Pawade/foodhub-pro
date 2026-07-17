package com.foodhub.booking.controller;

import com.foodhub.booking.dto.TableBookingDto;
import com.foodhub.booking.entity.TableBooking.BookingStatus;
import com.foodhub.booking.service.TableBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/table-bookings")
@RequiredArgsConstructor
public class TableBookingController {

    private final TableBookingService bookingService;

    @PostMapping
    public ResponseEntity<TableBookingDto> create(@RequestBody TableBookingDto req,
                                                   @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(bookingService.create(user.getUsername(), req));
    }

    @GetMapping("/my")
    public ResponseEntity<List<TableBookingDto>> myBookings(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(bookingService.getMyBookings(user.getUsername()));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<TableBookingDto> cancel(@PathVariable Long id,
                                                   @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(bookingService.cancel(id, user.getUsername()));
    }

    // Owner: view bookings for their restaurant
    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<TableBookingDto>> restaurantBookings(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(bookingService.getRestaurantBookings(restaurantId));
    }

    // Owner/Admin: update status
    @PatchMapping("/{id}/status")
    public ResponseEntity<TableBookingDto> updateStatus(@PathVariable Long id,
                                                         @RequestParam BookingStatus status) {
        return ResponseEntity.ok(bookingService.updateStatus(id, status));
    }
}
