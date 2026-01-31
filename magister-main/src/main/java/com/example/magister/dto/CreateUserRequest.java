package com.example.magister.dto;

import com.example.magister.entity.UserRole;
import lombok.Data;

@Data
public class CreateUserRequest {
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private UserRole role;
}
