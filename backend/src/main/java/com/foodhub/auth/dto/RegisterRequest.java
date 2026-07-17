package com.foodhub.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank @Size(min = 3, max = 50) private String username;
    @NotBlank @Email                   private String email;
    @NotBlank @Size(min = 6, max = 40) private String password;
    @Size(max = 100)                   private String fullName;
    @Size(max = 15)                    private String phone;
    private String role; // customer | restaurant_owner | delivery_partner
}
