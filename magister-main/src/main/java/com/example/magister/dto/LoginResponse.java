package com.example.magister.dto;

import com.example.magister.entity.UserRole;
import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private Long userId;
    private String email;
    private String fullName;
    private UserRole role;
}
