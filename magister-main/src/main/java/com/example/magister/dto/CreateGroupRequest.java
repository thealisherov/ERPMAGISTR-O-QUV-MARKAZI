package com.example.magister.dto;

import lombok.Data;

@Data
public class CreateGroupRequest {
    private String name;
    private String description;
    private Long teacherId;
    private String schedule;
}