package com.example.magister.dto;

import lombok.Data;

@Data
public class AwardCoinsRequest {
    private Long studentId;
    private Long groupId;
    private Integer amount;
    private String reason;
}