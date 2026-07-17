package com.foodhub.booking.dto;

import com.foodhub.booking.entity.TableBooking.BookingStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class TableBookingDto {
    private Long id;
    private Long restaurantId;
    private String restaurantName;
    private LocalDate bookingDate;
    private LocalTime bookingTime;
    private int numberOfGuests;
    private String specialRequest;
    private BookingStatus status;
    private LocalDateTime createdAt;

    // request fields
    private String date;
    private String time;
}
