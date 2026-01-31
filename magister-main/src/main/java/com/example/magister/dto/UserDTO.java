package com.example.magister.dto;

import com.example.magister.entity.UserRole;
import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private UserRole role;
    private Boolean active;
}