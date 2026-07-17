package com.foodhub.booking.service;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.booking.dto.TableBookingDto;
import com.foodhub.booking.entity.TableBooking;
import com.foodhub.booking.entity.TableBooking.BookingStatus;
import com.foodhub.booking.repository.TableBookingRepository;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TableBookingService {

    private final TableBookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;

    public TableBookingDto create(String username, TableBookingDto req) {
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Restaurant restaurant = restaurantRepository.findById(req.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

        TableBooking booking = new TableBooking();
        booking.setCustomer(customer);
        booking.setRestaurant(restaurant);
        booking.setBookingDate(LocalDate.parse(req.getDate()));
        booking.setBookingTime(LocalTime.parse(req.getTime()));
        booking.setNumberOfGuests(req.getNumberOfGuests());
        booking.setSpecialRequest(req.getSpecialRequest());

        return toDto(bookingRepository.save(booking));
    }

    public List<TableBookingDto> getMyBookings(String username) {
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return bookingRepository.findByCustomerIdOrderByBookingDateDescBookingTimeDesc(customer.getId())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<TableBookingDto> getRestaurantBookings(Long restaurantId) {
        return bookingRepository.findByRestaurantIdOrderByBookingDateDescBookingTimeDesc(restaurantId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public TableBookingDto cancel(Long id, String username) {
        TableBooking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!booking.getCustomer().getUsername().equals(username))
            throw new BadRequestException("Not your booking");
        if (booking.getStatus() != BookingStatus.PENDING)
            throw new BadRequestException("Only PENDING bookings can be cancelled");
        booking.setStatus(BookingStatus.CANCELLED);
        return toDto(bookingRepository.save(booking));
    }

    public TableBookingDto updateStatus(Long id, BookingStatus status) {
        TableBooking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        booking.setStatus(status);
        return toDto(bookingRepository.save(booking));
    }

    private TableBookingDto toDto(TableBooking b) {
        TableBookingDto dto = new TableBookingDto();
        dto.setId(b.getId());
        dto.setRestaurantId(b.getRestaurant().getId());
        dto.setRestaurantName(b.getRestaurant().getName());
        dto.setBookingDate(b.getBookingDate());
        dto.setBookingTime(b.getBookingTime());
        dto.setNumberOfGuests(b.getNumberOfGuests());
        dto.setSpecialRequest(b.getSpecialRequest());
        dto.setStatus(b.getStatus());
        dto.setCreatedAt(b.getCreatedAt());
        return dto;
    }
}
